using System;
using UnityEngine;

namespace Ghetto.Core
{
    /// <summary>
    /// The single source of truth for "where are we in the song".
    ///
    /// Everything visual, spatial and narrative in this experience is driven from here.
    /// Deliberately does NOT read AudioSource.time: that value is quantised to the audio
    /// buffer and jitters by several milliseconds frame to frame, which is very visible
    /// once you strobe lights or cut cameras on it. Instead we anchor to AudioSettings.dspTime,
    /// the same clock the audio thread schedules against, so visuals and audio cannot drift
    /// apart over a five minute track.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class MusicClock : MonoBehaviour
    {
        [Header("Tempo")]
        [Tooltip("Tempo of the track. Used only to derive beat/bar events for visual sync.")]
        [SerializeField] private double bpm = 82.0;

        [Tooltip("Beats per bar. 4 for common time.")]
        [SerializeField] private int beatsPerBar = 4;

        [Tooltip("Seconds between the scheduled audio start and the first downbeat. "
               + "Positive if the track has a lead-in before the beat lands.")]
        [SerializeField] private double firstDownbeatOffset;

        /// <summary>Raised once per beat, with the absolute beat index since the first downbeat.</summary>
        public event Action<int> Beat;

        /// <summary>Raised on the first beat of each bar, with the absolute bar index.</summary>
        public event Action<int> Bar;

        private double _dspStart = -1.0;
        private double _pausedAtSongTime;
        private int _lastBeatFired = -1;

        public bool IsRunning { get; private set; }
        public bool IsPaused { get; private set; }

        public double Bpm => bpm;
        public double SecondsPerBeat => 60.0 / bpm;
        public int BeatsPerBar => beatsPerBar;

        /// <summary>
        /// Position in the track, in seconds. Negative while we are inside the
        /// scheduling lead-in that StemMixer books ahead of the actual start.
        /// </summary>
        public double SongTime
        {
            get
            {
                if (!IsRunning) return 0.0;
                if (IsPaused) return _pausedAtSongTime;
                return AudioSettings.dspTime - _dspStart;
            }
        }

        /// <summary>Fractional beat position. 4.5 means halfway between beat 4 and 5.</summary>
        public double BeatPosition => (SongTime - firstDownbeatOffset) / SecondsPerBeat;

        /// <summary>0..1 sawtooth within the current beat. Handy for driving pulses.</summary>
        public float BeatPhase
        {
            get
            {
                double p = BeatPosition;
                if (p < 0.0) return 0f;
                return (float)(p - Math.Floor(p));
            }
        }

        /// <summary>
        /// Called by StemMixer once it has booked every stem to start at the same dsp timestamp.
        /// </summary>
        public void BeginAt(double dspStartTime)
        {
            _dspStart = dspStartTime;
            _lastBeatFired = -1;
            IsRunning = true;
            IsPaused = false;
        }

        public void Pause()
        {
            if (!IsRunning || IsPaused) return;
            _pausedAtSongTime = SongTime;
            IsPaused = true;
        }

        /// <summary>Resume, re-anchoring the dsp origin so SongTime picks up where it stopped.</summary>
        public void Resume()
        {
            if (!IsRunning || !IsPaused) return;
            _dspStart = AudioSettings.dspTime - _pausedAtSongTime;
            IsPaused = false;
        }

        public void Stop()
        {
            IsRunning = false;
            IsPaused = false;
            _dspStart = -1.0;
            _lastBeatFired = -1;
        }

        private void Update()
        {
            if (!IsRunning || IsPaused) return;

            double pos = BeatPosition;
            if (pos < 0.0) return;

            int current = (int)Math.Floor(pos);

            // Catch up rather than skip: a frame spike must not swallow a downbeat.
            while (_lastBeatFired < current)
            {
                _lastBeatFired++;
                Beat?.Invoke(_lastBeatFired);
                if (beatsPerBar > 0 && _lastBeatFired % beatsPerBar == 0)
                {
                    Bar?.Invoke(_lastBeatFired / beatsPerBar);
                }
            }
        }
    }
}
