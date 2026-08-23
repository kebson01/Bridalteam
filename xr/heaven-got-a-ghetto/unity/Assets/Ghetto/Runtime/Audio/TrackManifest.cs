using System;
using System.Collections.Generic;
using UnityEngine;

namespace Ghetto.Audio
{
    /// <summary>
    /// Where a stem sits in the world, and therefore what it means.
    /// The mapping from role to placement is the whole point of the piece: you do not
    /// listen to the mix, you walk around inside it.
    /// </summary>
    public enum StemRole
    {
        /// <summary>Non-diegetic bed. Plays 2D at constant level so the track never disappears.</summary>
        Bed,
        /// <summary>The voice. Anchored to the narrator presence, follows the listener loosely.</summary>
        Vocal,
        /// <summary>Drums / percussion. Placed low and central; felt more than heard.</summary>
        Rhythm,
        /// <summary>Bass. Omnidirectional, drives haptics.</summary>
        Bass,
        /// <summary>Keys, strings, samples. Scattered as discoverable points in space.</summary>
        Harmony,
        /// <summary>Backing vocals, ad libs, crowd. Placed as a ring around the listener.</summary>
        Chorus,
        /// <summary>Environmental audio authored by us, not part of the record.</summary>
        Ambience
    }

    [Serializable]
    public sealed class StemDefinition
    {
        [Tooltip("Filename inside Assets/StreamingAssets/Track/. Never committed to git.")]
        public string fileName;

        public StemRole role = StemRole.Bed;

        [Tooltip("Where this stem lives, relative to the experience origin.")]
        public Vector3 localPosition = Vector3.zero;

        [Range(0f, 1f)]
        [Tooltip("0 = pure 2D, always at full level. 1 = fully positional, falls off with distance.")]
        public float spatialBlend = 1f;

        [Range(0f, 2f)]
        public float gain = 1f;

        [Tooltip("Distance at which the stem is at full gain.")]
        public float minDistance = 1.5f;

        [Tooltip("Distance beyond which the stem is effectively inaudible.")]
        public float maxDistance = 14f;

        [Tooltip("If true, this stem is silent until a Chapter or trigger unmutes it.")]
        public bool startsMuted;
    }

    /// <summary>
    /// Describes the audio the experience expects to find on disk at runtime.
    ///
    /// No audio is imported into the Unity project and none is committed. The manifest
    /// names files; StemMixer streams them from StreamingAssets at boot. If the files are
    /// absent the experience still runs, in silent preview mode, so the scene work can be
    /// built and reviewed by people who do not hold the recording. See docs/RIGHTS.md.
    /// </summary>
    [CreateAssetMenu(menuName = "Ghetto/Track Manifest", fileName = "TrackManifest")]
    public sealed class TrackManifest : ScriptableObject
    {
        [Header("Identification")]
        public string trackTitle = "UNSET";
        public string performer = "UNSET";

        [Tooltip("Free text: who cleared this, under what agreement, expiring when. "
               + "Displayed in the in-experience credits panel.")]
        [TextArea(3, 8)]
        public string rightsNote =
            "No licence on file. This build is a private technical prototype and must not be "
            + "distributed, exhibited publicly, or streamed. See docs/RIGHTS.md.";

        [Tooltip("Gate on distribution. Leave false until a sync + master licence is actually signed.")]
        public bool clearedForDistribution;

        [Header("Timing")]
        [Tooltip("Length of the track in seconds. Used to lay out the chapter timeline "
               + "in the editor without needing the audio present.")]
        public double durationSeconds = 270.0;

        [Header("Stems")]
        [Tooltip("If you only have a stereo mixdown, define a single Bed stem with spatialBlend 0. "
               + "The experience degrades gracefully; you just lose the walk-through-the-mix mechanic.")]
        public List<StemDefinition> stems = new List<StemDefinition>();

        public bool HasStems => stems != null && stems.Count > 0;
    }
}
