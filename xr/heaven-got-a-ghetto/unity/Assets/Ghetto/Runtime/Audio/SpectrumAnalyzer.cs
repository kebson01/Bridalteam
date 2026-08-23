using UnityEngine;

namespace Ghetto.Audio
{
    /// <summary>
    /// Reduces the running mix to a handful of numbers that visuals can bind to.
    ///
    /// Bands are spaced roughly logarithmically because that is how hearing works: an even
    /// split of a 22kHz FFT puts almost every band above the region where a hip hop record
    /// actually lives, and the resulting visuals sit dead while the track is clearly moving.
    /// </summary>
    public sealed class SpectrumAnalyzer : MonoBehaviour
    {
        public const int BandCount = 8;

        [Tooltip("Source to analyse. Normally the Bed stem, or the loudest available stem.")]
        [SerializeField] private AudioSource source;

        [Tooltip("FFT resolution. 1024 is the usual balance of detail against cost.")]
        [SerializeField] private int fftSize = 1024;

        [Tooltip("How fast a band is allowed to fall. Higher = snappier, twitchier.")]
        [SerializeField] private float release = 3.5f;

        private float[] _spectrum;
        private readonly float[] _bands = new float[BandCount];
        private readonly float[] _smoothed = new float[BandCount];
        private readonly float[] _peaks = new float[BandCount];

        /// <summary>Raw band energies, 0..1-ish, unsmoothed.</summary>
        public float[] Bands => _bands;

        /// <summary>Band energies with release smoothing. Use these for anything a human looks at.</summary>
        public float[] Smoothed => _smoothed;

        /// <summary>Low-band energy. The kick and the 808. Good for haptics and floor pulses.</summary>
        public float Low => _smoothed[0] * 0.5f + _smoothed[1] * 0.5f;

        /// <summary>Mid energy. Where the voice sits.</summary>
        public float Mid => (_smoothed[3] + _smoothed[4]) * 0.5f;

        /// <summary>High energy. Hats, tape hiss, air.</summary>
        public float High => (_smoothed[6] + _smoothed[7]) * 0.5f;

        /// <summary>Overall loudness proxy, 0..1.</summary>
        public float Energy { get; private set; }

        public void SetSource(AudioSource s) => source = s;

        private void Awake()
        {
            _spectrum = new float[Mathf.ClosestPowerOfTwo(Mathf.Max(64, fftSize))];
        }

        private void Update()
        {
            if (source == null || !source.isPlaying)
            {
                Decay();
                return;
            }

            source.GetSpectrumData(_spectrum, 0, FFTWindow.Blackman);

            int cursor = 0;
            float total = 0f;

            for (int band = 0; band < BandCount; band++)
            {
                // Widths double each band: 2, 4, 8, 16 ... which tracks octaves closely enough.
                int width = (int)Mathf.Pow(2, band + 1);
                if (band == BandCount - 1)
                {
                    width += _spectrum.Length - (cursor + width); // sweep up the remainder
                }
                width = Mathf.Max(1, Mathf.Min(width, _spectrum.Length - cursor));

                float sum = 0f;
                for (int i = 0; i < width; i++)
                {
                    // Weight by index: high bins carry far less energy, so an unweighted
                    // average leaves the top bands permanently near zero.
                    sum += _spectrum[cursor + i] * (cursor + i + 1);
                }
                cursor += width;

                float value = sum / width;
                _bands[band] = value;

                if (value > _peaks[band]) _peaks[band] = value;
                // Normalise against a decaying running peak so the visuals adapt to quiet
                // passages instead of flatlining through the intro.
                _peaks[band] = Mathf.Max(0.0001f, _peaks[band] - Time.deltaTime * _peaks[band] * 0.2f);

                float normalised = Mathf.Clamp01(value / _peaks[band]);
                _smoothed[band] = normalised > _smoothed[band]
                    ? normalised
                    : Mathf.Lerp(_smoothed[band], normalised, Time.deltaTime * release);

                total += _smoothed[band];
            }

            Energy = Mathf.Clamp01(total / BandCount);
        }

        private void Decay()
        {
            for (int i = 0; i < BandCount; i++)
            {
                _bands[i] = 0f;
                _smoothed[i] = Mathf.Lerp(_smoothed[i], 0f, Time.deltaTime * release);
            }
            Energy = Mathf.Lerp(Energy, 0f, Time.deltaTime * release);
        }
    }
}
