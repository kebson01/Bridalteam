using UnityEngine;

namespace Ghetto.Audio
{
    /// <summary>
    /// One stem of the record, positioned in the world.
    ///
    /// Wraps an AudioSource with the two things the raw component lacks for this job:
    /// scheduled (sample-locked) transport, and a fade that survives pause/resume without
    /// fighting whatever else is animating the level.
    /// </summary>
    [RequireComponent(typeof(AudioSource))]
    public sealed class SpatialStem : MonoBehaviour
    {
        private AudioSource _source;
        private StemDefinition _def;
        private float _masterVolume = 1f;

        private float _fadeFrom;
        private float _fadeTo = 1f;
        private float _fadeElapsed;
        private float _fadeDuration;

        /// <summary>0..1 envelope applied on top of the stem's authored gain.</summary>
        public float Envelope { get; private set; } = 1f;

        public StemRole Role => _def?.role ?? StemRole.Bed;
        public AudioSource Source => _source;

        /// <summary>Peak amplitude of this stem over the last frame. Drives per-stem visuals.</summary>
        public float Level { get; private set; }

        private float[] _sampleBuffer;

        public void Configure(StemDefinition def, AudioClip clip, float masterVolume)
        {
            _def = def;
            _masterVolume = masterVolume;

            _source = GetComponent<AudioSource>();
            _source.clip = clip;
            _source.playOnAwake = false;
            _source.loop = false;
            _source.spatialBlend = def.spatialBlend;
            _source.rolloffMode = AudioRolloffMode.Custom;
            _source.minDistance = def.minDistance;
            _source.maxDistance = def.maxDistance;
            _source.dopplerLevel = 0f; // Doppler on a music stem sounds like a fault, not an effect.

            // A logarithmic-ish custom curve: holds near full inside minDistance then falls away
            // smoothly. Unity's built-in Logarithmic mode drops far too fast for musical material,
            // which makes the mix feel like it has holes in it as you walk.
            var curve = new AnimationCurve(
                new Keyframe(0f, 1f),
                new Keyframe(Mathf.InverseLerp(0f, def.maxDistance, def.minDistance), 1f),
                new Keyframe(1f, 0f));
            curve.SmoothTangents(1, 0f);
            _source.SetCustomCurve(AudioSourceCurveType.CustomRolloff, curve);

            Envelope = def.startsMuted ? 0f : 1f;
            _fadeTo = Envelope;
            _fadeDuration = 0f;

            ApplyVolume();

            _sampleBuffer = new float[256];
        }

        public void ScheduleStart(double dspTime)
        {
            if (_source == null) return;
            _source.PlayScheduled(dspTime);
        }

        public void FadeTo(float target, float seconds)
        {
            _fadeFrom = Envelope;
            _fadeTo = Mathf.Clamp01(target);
            _fadeDuration = Mathf.Max(0f, seconds);
            _fadeElapsed = 0f;

            if (_fadeDuration <= 0f)
            {
                Envelope = _fadeTo;
                ApplyVolume();
            }
        }

        public void Pause()
        {
            if (_source == null || !_source.isPlaying) return;
            _source.Pause();
        }

        public void Resume()
        {
            if (_source == null) return;
            _source.UnPause();
        }

        private void Update()
        {
            if (_fadeDuration > 0f && !Mathf.Approximately(Envelope, _fadeTo))
            {
                _fadeElapsed += Time.deltaTime;
                float t = Mathf.Clamp01(_fadeElapsed / _fadeDuration);
                // Equal-power-ish curve. A linear fade on musical material dips audibly in the middle.
                Envelope = Mathf.Lerp(_fadeFrom, _fadeTo, Mathf.SmoothStep(0f, 1f, t));
                ApplyVolume();
            }

            SampleLevel();
        }

        private void ApplyVolume()
        {
            if (_source == null || _def == null) return;
            _source.volume = Mathf.Clamp01(_def.gain * Envelope * _masterVolume);
        }

        private void SampleLevel()
        {
            if (_source == null || !_source.isPlaying || _sampleBuffer == null)
            {
                Level = Mathf.Lerp(Level, 0f, Time.deltaTime * 8f);
                return;
            }

            _source.GetOutputData(_sampleBuffer, 0);

            float peak = 0f;
            for (int i = 0; i < _sampleBuffer.Length; i++)
            {
                float a = _sampleBuffer[i];
                if (a < 0f) a = -a;
                if (a > peak) peak = a;
            }

            // Fast attack, slow release. Matches how the eye expects light to answer a drum.
            Level = peak > Level
                ? peak
                : Mathf.Lerp(Level, peak, Time.deltaTime * 6f);
        }
    }
}
