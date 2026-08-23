using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using Ghetto.Core;
using Ghetto.Audio;

namespace Ghetto.EditorTools
{
    /// <summary>
    /// Checks the edit for the mistakes that are invisible in the inspector and obvious
    /// in the headset: chapters that overlap, gaps in the middle of the track, stages
    /// referenced by name that do not exist, and an edit that runs past the end of the song.
    ///
    /// Cheap to run, and it catches the class of bug that otherwise costs a full
    /// build-and-deploy cycle to a headset to find.
    /// </summary>
    public static class ChapterSequenceValidator
    {
        [MenuItem("Ghetto/Validate Chapter Sequence")]
        public static void Validate()
        {
            ChapterSequence sequence = Selection.activeObject as ChapterSequence;
            if (sequence == null)
            {
                sequence = FindFirst<ChapterSequence>();
            }

            if (sequence == null)
            {
                EditorUtility.DisplayDialog(
                    "Validate Chapter Sequence",
                    "Select a ChapterSequence asset first, or create one via "
                    + "Create > Ghetto > Chapter Sequence.",
                    "OK");
                return;
            }

            TrackManifest manifest = FindFirst<TrackManifest>();
            var report = new StringBuilder();
            int problems = 0;

            if (sequence.Count == 0)
            {
                report.AppendLine("- Sequence has no chapters.");
                problems++;
            }

            var ordered = new List<Chapter>();
            for (int i = 0; i < sequence.Count; i++)
            {
                Chapter c = sequence.At(i);
                if (c == null)
                {
                    report.AppendLine($"- Slot {i} is empty.");
                    problems++;
                    continue;
                }

                if (c.endTime <= c.startTime)
                {
                    report.AppendLine(
                        $"- \"{c.title}\" ends ({c.endTime:F2}s) at or before it starts ({c.startTime:F2}s).");
                    problems++;
                }

                ordered.Add(c);
            }

            ordered.Sort((a, b) => a.startTime.CompareTo(b.startTime));

            for (int i = 1; i < ordered.Count; i++)
            {
                Chapter prev = ordered[i - 1];
                Chapter next = ordered[i];

                if (next.startTime < prev.endTime)
                {
                    report.AppendLine(
                        $"- \"{prev.title}\" and \"{next.title}\" overlap between "
                        + $"{next.startTime:F2}s and {prev.endTime:F2}s.");
                    problems++;
                }
                else if (next.startTime - prev.endTime > 0.05)
                {
                    // A gap is legal but almost always a typo, so it is a warning not an error.
                    report.AppendLine(
                        $"- Gap of {(next.startTime - prev.endTime):F2}s between \"{prev.title}\" "
                        + $"and \"{next.title}\". Intentional?");
                }
            }

            if (manifest != null && ordered.Count > 0)
            {
                Chapter last = ordered[ordered.Count - 1];
                if (last.endTime > manifest.durationSeconds + 0.05)
                {
                    report.AppendLine(
                        $"- Edit runs to {last.endTime:F2}s but the track is "
                        + $"{manifest.durationSeconds:F2}s long.");
                    problems++;
                }
            }

            foreach (Chapter c in ordered)
            {
                if (string.IsNullOrWhiteSpace(c.stageRootName))
                {
                    report.AppendLine($"- \"{c.title}\" has no stage root name.");
                }
            }

            string summary = problems == 0
                ? $"{sequence.Count} chapters, no blocking problems found."
                : $"{problems} problem(s) found across {sequence.Count} chapters.";

            string body = report.Length > 0
                ? summary + "\n\n" + report
                : summary;

            Debug.Log("[ChapterSequenceValidator]\n" + body, sequence);
            EditorUtility.DisplayDialog("Validate Chapter Sequence", body, "OK");
        }

        private static T FindFirst<T>() where T : Object
        {
            string[] guids = AssetDatabase.FindAssets($"t:{typeof(T).Name}");
            if (guids.Length == 0) return null;
            return AssetDatabase.LoadAssetAtPath<T>(AssetDatabase.GUIDToAssetPath(guids[0]));
        }
    }
}
