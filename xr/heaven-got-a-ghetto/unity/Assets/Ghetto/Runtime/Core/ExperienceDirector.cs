using System;
using System.Collections.Generic;
using UnityEngine;
using Ghetto.Audio;

namespace Ghetto.Core
{
    /// <summary>
    /// Watches the music clock and runs the edit: enables the right stage, moves the mix,
    /// and tells the rest of the game what the listener is allowed to do right now.
    ///
    /// Chapter changes are driven purely by song time, never by frame count or coroutine
    /// chains. If a frame hitches, or the listener's headset drops a few hundred milliseconds
    /// re-tracking, the experience lands back exactly where the record is rather than
    /// finishing the edit late.
    /// </summary>
    [RequireComponent(typeof(MusicClock))]
    public sealed class ExperienceDirector : MonoBehaviour
    {
        [SerializeField] private ChapterSequence sequence;
        [SerializeField] private StemMixer mixer;

        [Tooltip("Parent holding one child per chapter stage, matched by name to "
               + "Chapter.stageRootName. Children are toggled as chapters open and close.")]
        [SerializeField] private Transform stageContainer;

        [Tooltip("Log every chapter transition. Leave on: this is the single most useful "
               + "line in a bug report from a playtest.")]
        [SerializeField] private bool logTransitions = true;

        private MusicClock _clock;
        private int _currentIndex = -1;
        private readonly Dictionary<string, GameObject> _stages = new Dictionary<string, GameObject>();

        /// <summary>Fires when a chapter opens. Argument is the chapter, never null.</summary>
        public event Action<Chapter> ChapterEntered;

        /// <summary>Fires when a chapter closes. Argument is the chapter that just ended.</summary>
        public event Action<Chapter> ChapterExited;

        /// <summary>What the listener can currently do. Interaction scripts read this.</summary>
        public Agency CurrentAgency { get; private set; } = Agency.Observe;

        public Chapter CurrentChapter => sequence != null ? sequence.At(_currentIndex) : null;
        public MusicClock Clock => _clock;

        private void Awake()
        {
            _clock = GetComponent<MusicClock>();
            IndexStages();
        }

        private void IndexStages()
        {
            if (stageContainer == null) return;

            foreach (Transform child in stageContainer)
            {
                _stages[child.name] = child.gameObject;
                child.gameObject.SetActive(false);
            }
        }

        private void Update()
        {
            if (sequence == null || !_clock.IsRunning || _clock.IsPaused) return;

            double t = _clock.SongTime;
            int index = sequence.IndexAt(t);

            if (index == _currentIndex) return;

            // A gap in the edit is legitimate (dead air between movements). Close the
            // outgoing chapter but do not open anything.
            Chapter outgoing = sequence.At(_currentIndex);
            if (outgoing != null)
            {
                SetStageActive(outgoing.stageRootName, false);
                ChapterExited?.Invoke(outgoing);
            }

            _currentIndex = index;

            Chapter incoming = sequence.At(index);
            if (incoming == null)
            {
                CurrentAgency = Agency.Observe;
                return;
            }

            EnterChapter(incoming, t);
        }

        private void EnterChapter(Chapter chapter, double songTime)
        {
            if (logTransitions)
            {
                Debug.Log($"[Director] t={songTime:F2}s -> \"{chapter.title}\" (agency: {chapter.agency})");
            }

            SetStageActive(chapter.stageRootName, true);
            CurrentAgency = chapter.agency;

            if (mixer != null && chapter.stemCues != null)
            {
                foreach (StemCue cue in chapter.stemCues)
                {
                    foreach (SpatialStem stem in mixer.GetRole(cue.role))
                    {
                        stem.FadeTo(cue.target, cue.fadeSeconds);
                    }
                }
            }

            ChapterEntered?.Invoke(chapter);
        }

        private void SetStageActive(string stageName, bool active)
        {
            if (string.IsNullOrWhiteSpace(stageName)) return;
            if (_stages.TryGetValue(stageName, out GameObject go) && go != null)
            {
                go.SetActive(active);
            }
            else if (active)
            {
                Debug.LogWarning($"[Director] Chapter wants stage \"{stageName}\" but no child of "
                               + $"{stageContainer?.name ?? "(no container)"} has that name.");
            }
        }

        /// <summary>
        /// Jump the edit to a chapter. Editor and playtest tool only: this moves the
        /// director but not the audio, so the two will be out of step afterwards.
        /// </summary>
        public void DebugJumpTo(int index)
        {
            Chapter target = sequence?.At(index);
            if (target == null) return;

            Chapter outgoing = CurrentChapter;
            if (outgoing != null)
            {
                SetStageActive(outgoing.stageRootName, false);
                ChapterExited?.Invoke(outgoing);
            }

            _currentIndex = index;
            EnterChapter(target, target.startTime);
        }
    }
}
