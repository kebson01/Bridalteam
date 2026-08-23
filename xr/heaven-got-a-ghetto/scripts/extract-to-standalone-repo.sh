#!/usr/bin/env bash
#
# Split xr/heaven-got-a-ghetto out of the Bridalteam repo into its own repository,
# preserving the commit history for this directory only.
#
# Usage:
#   1. Create an empty repo on GitHub (no README, no .gitignore, no licence).
#   2. From the root of a clone of Bridalteam:
#        ./xr/heaven-got-a-ghetto/scripts/extract-to-standalone-repo.sh <new-repo-url>
#
set -euo pipefail

REMOTE="${1:-}"
PREFIX="xr/heaven-got-a-ghetto"
BRANCH="main"
SPLIT_BRANCH="_split-heaven-got-a-ghetto"

if [[ -z "$REMOTE" ]]; then
  echo "usage: $0 <new-repo-url>" >&2
  echo "example: $0 git@github.com:kebson01/heaven-got-a-ghetto.git" >&2
  exit 1
fi

if [[ ! -d "$PREFIX" ]]; then
  echo "error: run this from the root of the Bridalteam clone (no $PREFIX here)." >&2
  exit 1
fi

WORKDIR="$(mktemp -d)"
cleanup() {
  rm -rf "$WORKDIR"
  # The split branch is scaffolding; drop it so the source repo is left as we found it.
  git branch -D "$SPLIT_BRANCH" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> Splitting $PREFIX into a standalone history"
# Split onto a real branch, not a bare SHA: a loose commit that no ref points at is
# unreachable, and the clone below would not copy it.
git branch -D "$SPLIT_BRANCH" >/dev/null 2>&1 || true
git subtree split --prefix="$PREFIX" -b "$SPLIT_BRANCH"

echo "==> Building the new repo in $WORKDIR"
git clone --single-branch --branch "$SPLIT_BRANCH" . "$WORKDIR/repo"

git -C "$WORKDIR/repo" branch -m "$SPLIT_BRANCH" "$BRANCH"
git -C "$WORKDIR/repo" remote set-url origin "$REMOTE"

echo "==> Pushing to $REMOTE"
git -C "$WORKDIR/repo" push -u origin "$BRANCH"

cat <<DONE

Done. $REMOTE now holds this project on branch '$BRANCH'.

Next:
  - Clone it fresh somewhere outside Bridalteam.
  - In Bridalteam: git rm -r $PREFIX && git commit -m "Move XR project to its own repo"

DONE
