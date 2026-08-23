using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR;
using UnityEngine.XR.Management;

namespace Ghetto.Core
{
    public enum PresentationMode
    {
        /// <summary>Flat screen. Editor, desktop preview, and the fallback when no headset is present.</summary>
        Screen,
        /// <summary>Opaque headset. Fully synthetic world.</summary>
        ImmersiveVR,
        /// <summary>See-through headset or handheld. The listener's own room is the set.</summary>
        PassthroughAR
    }

    /// <summary>
    /// Decides at boot whether we are running flat, in VR, or in AR, and configures
    /// the rig accordingly.
    ///
    /// One build, three presentations. The alternative -- separate AR and VR projects --
    /// doubles the authoring cost of every chapter and guarantees the two versions drift.
    /// The cost of doing it this way is that every stage has to be authored to survive
    /// having its skybox and floor taken away, which is a real constraint on the art
    /// direction and needs to be understood up front rather than discovered late.
    /// </summary>
    public sealed class XRModeBootstrapper : MonoBehaviour
    {
        [Header("Rigs")]
        [Tooltip("Camera rig used when a headset is present.")]
        [SerializeField] private GameObject xrRig;

        [Tooltip("Camera used for flat preview in the editor and on desktop.")]
        [SerializeField] private GameObject screenRig;

        [Header("World")]
        [Tooltip("Objects that only make sense in a fully synthetic world: skybox proxies, "
               + "ground planes, distant environment. Hidden in passthrough AR.")]
        [SerializeField] private List<GameObject> vrOnlyEnvironment = new List<GameObject>();

        [Tooltip("Objects that only make sense against the listener's real room: "
               + "plane-anchored props, occlusion proxies, placement reticles.")]
        [SerializeField] private List<GameObject> arOnlyEnvironment = new List<GameObject>();

        [Header("Override")]
        [Tooltip("Force a mode regardless of hardware. Useful for capture and for demoing "
               + "the AR staging on a desktop.")]
        [SerializeField] private bool forceMode;
        [SerializeField] private PresentationMode forcedMode = PresentationMode.Screen;

        public PresentationMode Mode { get; private set; } = PresentationMode.Screen;

        /// <summary>True once the mode has been resolved and the rig switched.</summary>
        public bool Ready { get; private set; }

        private IEnumerator Start()
        {
            if (forceMode)
            {
                Apply(forcedMode);
                Ready = true;
                yield break;
            }

            yield return StartCoroutine(InitialiseXR());

            Apply(DetectMode());
            Ready = true;
        }

        private static IEnumerator InitialiseXR()
        {
            XRManagerSettings manager = XRGeneralSettings.Instance != null
                ? XRGeneralSettings.Instance.Manager
                : null;

            if (manager == null) yield break;

            if (!manager.isInitializationComplete)
            {
                yield return manager.InitializeLoader();
            }

            manager.StartSubsystems();
        }

        private static PresentationMode DetectMode()
        {
            var displays = new List<XRDisplaySubsystem>();
            SubsystemManager.GetSubsystems(displays);

            XRDisplaySubsystem display = null;
            foreach (XRDisplaySubsystem d in displays)
            {
                if (d != null && d.running) { display = d; break; }
            }

            if (display == null) return PresentationMode.Screen;

            // displayOpaque is the honest signal here: it is what the runtime reports about
            // the physical device rather than what the project was configured to hope for.
            // A Quest running passthrough reports non-opaque; the same headset in a fully
            // immersive app reports opaque.
            return display.displayOpaque
                ? PresentationMode.ImmersiveVR
                : PresentationMode.PassthroughAR;
        }

        private void Apply(PresentationMode mode)
        {
            Mode = mode;

            bool headset = mode != PresentationMode.Screen;
            if (xrRig != null) xrRig.SetActive(headset);
            if (screenRig != null) screenRig.SetActive(!headset);

            bool synthetic = mode != PresentationMode.PassthroughAR;
            foreach (GameObject go in vrOnlyEnvironment)
            {
                if (go != null) go.SetActive(synthetic);
            }
            foreach (GameObject go in arOnlyEnvironment)
            {
                if (go != null) go.SetActive(mode == PresentationMode.PassthroughAR);
            }

            Debug.Log($"[XRModeBootstrapper] Presenting in {mode}.");
        }
    }
}
