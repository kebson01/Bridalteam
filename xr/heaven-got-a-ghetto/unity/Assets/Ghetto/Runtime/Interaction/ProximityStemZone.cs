using UnityEngine;
using Ghetto.Audio;
using Ghetto.Core;

namespace Ghetto.Interaction
{
    /// <summary>
    /// A region of the room that belongs to one part of the record.
    ///
    /// This is the mechanic the whole piece rests on. Walking toward the zone brings its
    /// stem up and pushes the others back, so the listener mixes the record with their
    /// body. Standing in the middle of the room gives you the record as it was mastered;
    /// stepping into a corner gives you something no one has heard, which is the thing
    /// that makes this worth building at all.
    /// </summary>
    public sealed class ProximityStemZone : MonoBehaviour
    {
        [SerializeField] private StemMixer mixer;
        [SerializeField] private ExperienceDirector director;

        [Header("Zone")]
        [Tooltip("The stem this zone belongs to.")]
        [SerializeField] private StemRole role = StemRole.Rhythm;

        [Tooltip("Inside this radius the stem is at full focus.")]
        [SerializeField] private float innerRadius = 1.2f;

        [Tooltip("Beyond this radius the zone has no influence.")]
        [SerializeField] private float outerRadius = 4f;

        [Header("Response")]
        [Tooltip("Level for this zone's stem at full focus.")]
        [Range(0f, 1f)] [SerializeField] private float focusedLevel = 1f;

        [Tooltip("Level the OTHER stems duck to at full focus. Not zero: the record should "
               + "never fall apart, it should only lean.")]
        [Range(0f, 1f)] [SerializeField] private float duckOthersTo = 0.45f;

        [Tooltip("How quickly the mix answers movement. Too fast reads as a bug, too slow "
               + "breaks the sense that your body is doing it. ~0.35s tests well.")]
        [SerializeField] private float responseSeconds = 0.35f;

        [Header("Debug")]
        [SerializeField] private bool drawGizmo = true;

        private Transform _listener;
        private float _focus;

        /// <summary>0..1, how much this zone currently owns the mix.</summary>
        public float Focus => _focus;
        public StemRole Role => role;

        private void Awake()
        {
            // AudioListener rather than Camera.main: in an XR rig the listener may sit on
            // a different transform to the rendering camera, and it is the listener's
            // position that actually determines what the person hears.
            AudioListener al = FindFirstObjectByType<AudioListener>();
            if (al != null) _listener = al.transform;
        }

        private void Update()
        {
            if (mixer == null || _listener == null) return;

            // Only live during chapters that invite the listener to move. Otherwise a
            // seated listener drifting on their tracking would get an unexplained mix change.
            if (director != null && director.CurrentAgency != Agency.Roam)
            {
                if (_focus > 0.001f) Release();
                return;
            }

            float distance = Vector3.Distance(_listener.position, transform.position);
            float target = 1f - Mathf.Clamp01(
                Mathf.InverseLerp(innerRadius, outerRadius, distance));

            if (Mathf.Abs(target - _focus) < 0.001f) return;

            _focus = target;
            ApplyFocus();
        }

        private void ApplyFocus()
        {
            foreach (SpatialStem stem in mixer.Stems)
            {
                float level = stem.Role == role
                    ? Mathf.Lerp(1f, focusedLevel, _focus)
                    : Mathf.Lerp(1f, duckOthersTo, _focus);

                stem.FadeTo(level, responseSeconds);
            }
        }

        private void Release()
        {
            _focus = 0f;
            foreach (SpatialStem stem in mixer.Stems)
            {
                stem.FadeTo(1f, responseSeconds);
            }
        }

        private void OnDrawGizmosSelected()
        {
            if (!drawGizmo) return;

            Gizmos.color = new Color(1f, 0.85f, 0.2f, 0.9f);
            Gizmos.DrawWireSphere(transform.position, innerRadius);
            Gizmos.color = new Color(1f, 0.85f, 0.2f, 0.25f);
            Gizmos.DrawWireSphere(transform.position, outerRadius);
        }
    }
}
