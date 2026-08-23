using System;
using System.Collections.Generic;
using UnityEngine;
using Ghetto.Audio;

namespace Ghetto.Core
{
    /// <summary>
    /// What the listener should be able to do during a stretch of the track.
    /// </summary>
    public enum Agency
    {
        /// <summary>Look anywhere, but the world does not respond. Used for arrival and for the outro.</summary>
        Observe,
        /// <summary>Objects respond to gaze dwell. No locomotion.</summary>
        Gaze,
        /// <summary>Room-scale walking changes the mix. The core mechanic.</summary>
        Roam,
        /// <summary>Direct hand interaction with a small number of objects.</summary>
        Touch
    }

    [Serializable]
    public sealed class StemCue
    {
        public StemRole role;
        [Range(0f, 1f)] public float target = 1f;
        [Min(0f)] public float fadeSeconds = 2f;
    }

    /// <summary>
    /// One movement of the experience, pinned to a window of song time.
    ///
    /// Chapters are data, not code, so the timeline can be re-cut against the record
    /// without a recompile. That matters more than usual here: the edit is going to be
    /// revised many times against the actual audio, and every revision that needs a
    /// programmer is a revision that does not happen.
    /// </summary>
    [CreateAssetMenu(menuName = "Ghetto/Chapter", fileName = "Chapter")]
    public sealed class Chapter : ScriptableObject
    {
        [Header("Identity")]
        public string title = "Untitled";

        [TextArea(2, 6)]
        [Tooltip("Director's note. What is the listener supposed to feel here?")]
        public string intent;

        [Header("Timing (seconds into the track)")]
        [Min(0f)] public double startTime;
        [Min(0f)] public double endTime = 30.0;

        [Header("Staging")]
        [Tooltip("Root object enabled for the duration of this chapter. "
               + "Everything the chapter needs should live under it.")]
        public string stageRootName;

        [Tooltip("Seconds to cross-fade the stage in and out.")]
        [Min(0f)] public float transitionSeconds = 2.5f;

        [Header("Listener")]
        public Agency agency = Agency.Observe;

        [Tooltip("Comfort: dim the periphery during this chapter. Use for any chapter that "
               + "moves the listener without their input.")]
        public bool vignette;

        [Header("Mix")]
        [Tooltip("Stem levels to move to when this chapter opens.")]
        public List<StemCue> stemCues = new List<StemCue>();

        public double Duration => Mathf.Max(0f, (float)(endTime - startTime));

        public bool Contains(double songTime) => songTime >= startTime && songTime < endTime;

        /// <summary>0..1 progress through this chapter.</summary>
        public float Progress(double songTime)
        {
            double d = endTime - startTime;
            if (d <= 0.0) return 0f;
            return Mathf.Clamp01((float)((songTime - startTime) / d));
        }
    }
}
