using System;
using UnityEngine;
using Ghetto.Core;

namespace Ghetto.Interaction
{
    /// <summary>
    /// Fires when the listener looks at this object and keeps looking at it.
    ///
    /// Dwell rather than a controller press because a good half of the people who will
    /// ever try this will not be holding controllers, will not know what the triggers do,
    /// and will not want to be taught during a song. Looking is the one input everybody
    /// already has.
    /// </summary>
    public sealed class GazeDwellTrigger : MonoBehaviour
    {
        [SerializeField] private ExperienceDirector director;

        [Tooltip("Seconds of continuous gaze required. Below ~0.8s this fires by accident "
               + "as people look around; above ~2.5s it feels broken.")]
        [SerializeField] private float dwellSeconds = 1.4f;

        [Tooltip("Half-angle in degrees that counts as looking at this object.")]
        [SerializeField] private float coneAngle = 8f;

        [Tooltip("Maximum distance at which gaze registers.")]
        [SerializeField] private float maxDistance = 12f;

        [Tooltip("Once fired, ignore further gaze. Use for one-shot narrative beats.")]
        [SerializeField] private bool oneShot = true;

        /// <summary>Progress toward firing, 0..1. Drive a reticle or a fill from this.</summary>
        public float Progress { get; private set; }

        public event Action Triggered;
        public event Action<bool> GazeChanged;

        private Transform _head;
        private float _dwell;
        private bool _fired;
        private bool _wasGazed;

        private void Awake()
        {
            Camera cam = Camera.main;
            if (cam != null) _head = cam.transform;
        }

        private void Update()
        {
            if (_fired && oneShot) return;

            if (_head == null)
            {
                Camera cam = Camera.main;
                if (cam == null) return;
                _head = cam.transform;
            }

            bool gazed = IsGazed();

            if (gazed != _wasGazed)
            {
                _wasGazed = gazed;
                GazeChanged?.Invoke(gazed);
            }

            if (gazed)
            {
                _dwell += Time.deltaTime;
                if (_dwell >= dwellSeconds)
                {
                    _fired = true;
                    Progress = 1f;
                    Triggered?.Invoke();
                    return;
                }
            }
            else
            {
                // Decay rather than reset. A momentary glance away -- a blink, a tracking
                // wobble, someone walking past in passthrough -- should not throw away
                // the second the listener already spent.
                _dwell = Mathf.Max(0f, _dwell - Time.deltaTime * 1.5f);
            }

            Progress = dwellSeconds > 0f ? Mathf.Clamp01(_dwell / dwellSeconds) : 0f;
        }

        private bool IsGazed()
        {
            if (director != null
                && director.CurrentAgency != Agency.Gaze
                && director.CurrentAgency != Agency.Roam)
            {
                return false;
            }

            Vector3 toMe = transform.position - _head.position;
            float distance = toMe.magnitude;
            if (distance > maxDistance || distance < 0.01f) return false;

            return Vector3.Angle(_head.forward, toMe) <= coneAngle;
        }

        public void ResetTrigger()
        {
            _fired = false;
            _dwell = 0f;
            Progress = 0f;
        }
    }
}
