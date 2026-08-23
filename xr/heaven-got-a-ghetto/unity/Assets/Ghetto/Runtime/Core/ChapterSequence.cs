using System.Collections.Generic;
using UnityEngine;

namespace Ghetto.Core
{
    /// <summary>
    /// The ordered edit. Held as its own asset so the running order can be swapped
    /// wholesale for an alternate cut (a short festival version, an accessibility
    /// seated version) without touching the scene.
    /// </summary>
    [CreateAssetMenu(menuName = "Ghetto/Chapter Sequence", fileName = "ChapterSequence")]
    public sealed class ChapterSequence : ScriptableObject
    {
        [Tooltip("Chapters in playback order. Overlaps and gaps are reported by the "
               + "validator in the Ghetto menu.")]
        public List<Chapter> chapters = new List<Chapter>();

        public int Count => chapters?.Count ?? 0;

        public Chapter At(int index)
        {
            if (chapters == null || index < 0 || index >= chapters.Count) return null;
            return chapters[index];
        }

        /// <summary>Index of the chapter covering this song time, or -1 if we are in a gap.</summary>
        public int IndexAt(double songTime)
        {
            if (chapters == null) return -1;
            for (int i = 0; i < chapters.Count; i++)
            {
                Chapter c = chapters[i];
                if (c != null && c.Contains(songTime)) return i;
            }
            return -1;
        }
    }
}
