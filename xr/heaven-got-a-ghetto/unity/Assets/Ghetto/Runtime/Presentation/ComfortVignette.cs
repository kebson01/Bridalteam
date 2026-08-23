using UnityEngine;
using Ghetto.Core;

namespace Ghetto.Presentation
{
    /// <summary>
    /// Narrows the field of view during induced motion.
    ///
    /// Not decoration and not optional. Any moment where the world moves and the listener
    /// did not ask it to is a moment somebody gets sick, and somebody being sick in the
    /// second verse means they never hear the third. The vignette costs almost nothing
    /// and buys most of the comfort back.
    /// </summary>
    public sealed class ComfortVignette : MonoBehaviour
    {
        [SerializeField] private ExperienceDirector director;
        [SerializeField] private Renderer vignetteQuad;

        [Tooltip("Aperture when fully open (no vignette). 1 = unobstructed.")]
        [Range(0f, 1f)] [SerializeField] private float openAperture = 1f;

        [Tooltip("Aperture during induced motion. ~0.6 is the usual comfort setting.")]
        [Range(0f, 1f)] [SerializeField] private float closedAperture = 0.62f;

        [Tooltip("Seconds to open or close. Fast enough to help, slow enough not to be seen.")]
        [SerializeField] private float transitionSeconds = 0.4f;

        [SerializeField] private string apertureProperty = "_Aperture";

        private MaterialPropertyBlock _block;
        private int _propertyId;
        private float _current;
        private float _target;

        /// <summary>Set by anything that moves the listener without their input.</summary>
        public bool ForceClosed { get; set; }

        private void Awake()
        {
            _block = new MaterialPropertyBlock();
            _propertyId = Shader.PropertyToID(apertureProperty);
            _current = openAperture;
            _target = openAperture;
        }

        private void Update()
        {
            bool close = ForceClosed
                      || (director != null
                          && director.CurrentChapter != null
                          && director.CurrentChapter.vignette);

            _target = close ? closedAperture : openAperture;

            if (!Mathf.Approximately(_current, _target))
            {
                float rate = transitionSeconds > 0f ? Time.deltaTime / transitionSeconds : 1f;
                _current = Mathf.MoveTowards(_current, _target, rate);
                Apply();
            }
        }

        private void Apply()
        {
            if (vignetteQuad == null) return;
            vignetteQuad.GetPropertyBlock(_block);
            _block.SetFloat(_propertyId, _current);
            vignetteQuad.SetPropertyBlock(_block);
        }
    }
}
