using UnityEngine;
using Ghetto.Audio;
using Ghetto.Core;

namespace Ghetto.Presentation
{
    public enum ReactiveSource { Low, Mid, High, Energy, BeatPulse, StemLevel }

    public enum ReactiveTarget { Scale, EmissionIntensity, LightIntensity, MaterialFloat }

    /// <summary>
    /// Binds one number from the running audio to one visual property.
    ///
    /// Kept deliberately small and boring. The temptation on a project like this is a
    /// clever node graph; what actually ships is fifty of these on fifty objects, each
    /// tuned by hand against the record, because "does this look like it is on the beat"
    /// is a judgement no parameter surface makes for you.
    /// </summary>
    public sealed class AudioReactive : MonoBehaviour
    {
        [Header("Input")]
        [SerializeField] private SpectrumAnalyzer analyzer;
        [SerializeField] private MusicClock clock;
        [SerializeField] private SpatialStem stem;
        [SerializeField] private ReactiveSource source = ReactiveSource.Low;

        [Header("Shaping")]
        [Tooltip("Input is remapped from this range to the output range, then clamped.")]
        [SerializeField] private Vector2 inputRange = new Vector2(0f, 1f);

        [Tooltip("Raise above 1 to make the response snappier and ignore quiet material.")]
        [Min(0.01f)] [SerializeField] private float exponent = 1.6f;

        [Tooltip("Extra smoothing on top of the analyzer's own. 0 = none.")]
        [Min(0f)] [SerializeField] private float smoothing = 8f;

        [Header("Output")]
        [SerializeField] private ReactiveTarget target = ReactiveTarget.Scale;
        [SerializeField] private Vector2 outputRange = new Vector2(1f, 1.25f);

        [Tooltip("Shader property name, for the MaterialFloat and EmissionIntensity targets.")]
        [SerializeField] private string materialProperty = "_EmissiveIntensity";

        private Vector3 _baseScale;
        private Light _light;
        private Renderer _renderer;
        private MaterialPropertyBlock _block;
        private int _propertyId;
        private float _value;

        private void Awake()
        {
            _baseScale = transform.localScale;
            _light = GetComponent<Light>();
            _renderer = GetComponent<Renderer>();
            _block = new MaterialPropertyBlock();
            _propertyId = Shader.PropertyToID(materialProperty);
        }

        private void Update()
        {
            float raw = ReadSource();

            float t = Mathf.InverseLerp(inputRange.x, inputRange.y, raw);
            t = Mathf.Pow(Mathf.Clamp01(t), exponent);

            _value = smoothing > 0f
                ? Mathf.Lerp(_value, t, 1f - Mathf.Exp(-smoothing * Time.deltaTime))
                : t;

            Apply(Mathf.Lerp(outputRange.x, outputRange.y, _value));
        }

        private float ReadSource()
        {
            switch (source)
            {
                case ReactiveSource.Low:       return analyzer != null ? analyzer.Low : 0f;
                case ReactiveSource.Mid:       return analyzer != null ? analyzer.Mid : 0f;
                case ReactiveSource.High:      return analyzer != null ? analyzer.High : 0f;
                case ReactiveSource.Energy:    return analyzer != null ? analyzer.Energy : 0f;
                case ReactiveSource.StemLevel: return stem != null ? stem.Level : 0f;
                case ReactiveSource.BeatPulse:
                    // Decaying pulse from the clock. Works even with no audio present,
                    // which is what keeps silent preview mode useful for staging.
                    return clock != null && clock.IsRunning ? 1f - clock.BeatPhase : 0f;
                default: return 0f;
            }
        }

        private void Apply(float v)
        {
            switch (target)
            {
                case ReactiveTarget.Scale:
                    transform.localScale = _baseScale * v;
                    break;

                case ReactiveTarget.LightIntensity:
                    if (_light != null) _light.intensity = v;
                    break;

                case ReactiveTarget.EmissionIntensity:
                case ReactiveTarget.MaterialFloat:
                    if (_renderer != null)
                    {
                        // Property block rather than renderer.material: touching .material
                        // instantiates a copy per object and breaks SRP batching, which on
                        // a standalone headset is the difference between 72fps and not.
                        _renderer.GetPropertyBlock(_block);
                        _block.SetFloat(_propertyId, v);
                        _renderer.SetPropertyBlock(_block);
                    }
                    break;
            }
        }
    }
}
