using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using Ghetto.Core;

namespace Ghetto.Audio
{
    /// <summary>
    /// Loads the track's stems from StreamingAssets and starts them phase-locked.
    ///
    /// The critical detail is that every stem is booked with PlayScheduled against a single
    /// future dspTime. Calling Play() on eight AudioSources in a loop starts them on eight
    /// different audio buffers; on a headset that is an audible flam and it gets worse as
    /// the track runs. Booking one timestamp ahead of the audio thread keeps them sample
    /// aligned for the whole piece.
    /// </summary>
    [RequireComponent(typeof(MusicClock))]
    public sealed class StemMixer : MonoBehaviour
    {
        [SerializeField] private TrackManifest manifest;

        [Tooltip("How far ahead to book the start. Needs to exceed worst-case load and "
               + "audio buffer latency on the target device. 0.5s is comfortable on standalone.")]
        [SerializeField] private double scheduleLeadIn = 0.5;

        [Tooltip("Master gain applied on top of each stem's own gain.")]
        [Range(0f, 1f)]
        [SerializeField] private float masterVolume = 1f;

        private MusicClock _clock;
        private readonly List<SpatialStem> _stems = new List<SpatialStem>();
        private readonly Dictionary<StemRole, List<SpatialStem>> _byRole =
            new Dictionary<StemRole, List<SpatialStem>>();

        /// <summary>True when the audio files were found and loaded. False = silent preview mode.</summary>
        public bool AudioAvailable { get; private set; }

        public TrackManifest Manifest => manifest;
        public IReadOnlyList<SpatialStem> Stems => _stems;

        private void Awake()
        {
            _clock = GetComponent<MusicClock>();
        }

        private IEnumerator Start()
        {
            if (manifest == null)
            {
                Debug.LogError("[StemMixer] No TrackManifest assigned. Nothing to play.");
                yield break;
            }

            if (!manifest.HasStems)
            {
                Debug.LogWarning("[StemMixer] Manifest defines no stems. Running silent preview.");
                StartSilentPreview();
                yield break;
            }

            int loaded = 0;
            foreach (StemDefinition def in manifest.stems)
            {
                yield return LoadStem(def, ok => { if (ok) loaded++; });
            }

            if (loaded == 0)
            {
                Debug.LogWarning(
                    "[StemMixer] No stem files found in StreamingAssets/Track. Running silent preview "
                    + "so the scene can still be authored and reviewed. See docs/RIGHTS.md for how to "
                    + "supply your own licensed audio.");
                StartSilentPreview();
                yield break;
            }

            AudioAvailable = true;
            BeginPlayback();
        }

        private IEnumerator LoadStem(StemDefinition def, System.Action<bool> done)
        {
            if (string.IsNullOrWhiteSpace(def.fileName))
            {
                done(false);
                yield break;
            }

            string path = System.IO.Path.Combine(Application.streamingAssetsPath, "Track", def.fileName);
            string url = path.Contains("://") ? path : "file://" + path;

            AudioType type = GuessAudioType(def.fileName);
            using (UnityWebRequest req = UnityWebRequestMultimedia.GetAudioClip(url, type))
            {
                // Streaming keeps peak memory sane on standalone headsets; an eight stem
                // uncompressed track will not fit comfortably otherwise.
                ((DownloadHandlerAudioClip)req.downloadHandler).streamAudio = true;

                yield return req.SendWebRequest();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogWarning($"[StemMixer] Missing stem '{def.fileName}' ({req.error}).");
                    done(false);
                    yield break;
                }

                AudioClip clip = DownloadHandlerAudioClip.GetContent(req);
                if (clip == null)
                {
                    done(false);
                    yield break;
                }

                clip.name = def.fileName;
                SpawnStem(def, clip);
                done(true);
            }
        }

        private void SpawnStem(StemDefinition def, AudioClip clip)
        {
            var go = new GameObject($"Stem_{def.role}_{def.fileName}");
            go.transform.SetParent(transform, false);
            go.transform.localPosition = def.localPosition;

            SpatialStem stem = go.AddComponent<SpatialStem>();
            stem.Configure(def, clip, masterVolume);

            _stems.Add(stem);
            if (!_byRole.TryGetValue(def.role, out List<SpatialStem> list))
            {
                list = new List<SpatialStem>();
                _byRole[def.role] = list;
            }
            list.Add(stem);
        }

        private void BeginPlayback()
        {
            double startAt = AudioSettings.dspTime + scheduleLeadIn;

            foreach (SpatialStem stem in _stems)
            {
                stem.ScheduleStart(startAt);
            }

            _clock.BeginAt(startAt);
        }

        /// <summary>
        /// Runs the clock with no audio so chapters, staging and camera work can be
        /// reviewed by anyone, including people with no rights to the recording.
        /// </summary>
        private void StartSilentPreview()
        {
            AudioAvailable = false;
            _clock.BeginAt(AudioSettings.dspTime + scheduleLeadIn);
        }

        public IReadOnlyList<SpatialStem> GetRole(StemRole role)
        {
            return _byRole.TryGetValue(role, out List<SpatialStem> list)
                ? list
                : System.Array.Empty<SpatialStem>();
        }

        public void SetRoleMuted(StemRole role, bool muted, float fadeSeconds = 1.5f)
        {
            foreach (SpatialStem stem in GetRole(role))
            {
                stem.FadeTo(muted ? 0f : 1f, fadeSeconds);
            }
        }

        public void Pause()
        {
            _clock.Pause();
            foreach (SpatialStem stem in _stems) stem.Pause();
        }

        public void Resume()
        {
            _clock.Resume();
            foreach (SpatialStem stem in _stems) stem.Resume();
        }

        private static AudioType GuessAudioType(string fileName)
        {
            string ext = System.IO.Path.GetExtension(fileName).ToLowerInvariant();
            switch (ext)
            {
                case ".ogg": return AudioType.OGGVORBIS;
                case ".mp3": return AudioType.MPEG;
                case ".wav": return AudioType.WAV;
                case ".aiff":
                case ".aif": return AudioType.AIFF;
                default: return AudioType.UNKNOWN;
            }
        }
    }
}
