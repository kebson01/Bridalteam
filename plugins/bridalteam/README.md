# Bridal Team plugin for Claude Code

Skills for running and growing Bridal Team. Each skill lives in
`skills/<name>/SKILL.md`. Add a skill by creating a new folder there.

## Skills

| Skill | Use it for |
|---|---|
| `seo-promotion` | SEO audits, getting listed on major websites and directories, press and roundup pitches, AI-search visibility, and keeping `PROMOTION-TRACKER.md` up to date. |
| `vendor-outreach` | Call lists and scripts for getting vendors to claim their listings, claim-your-listing messages, recording outcomes in `VENDOR-PROSPECTS.md`, researching new vendors, and backlink asks. |
| `find-vendor-emails` | Finding the contact email each vendor publishes (own site, own Facebook Page or listing), recording it with its source in `VENDOR-PROSPECTS.md`, and drafting the matching database update. |
| `couples-acquisition` | Diagnosing the couples funnel from `page_events`, drafting Reddit answers, Facebook group posts, Pinterest pins and short videos that follow each community's rules, tagging links, keeping `COUPLES-TRACKER.md`, and weekly reports. |

## Install

From Claude Code, add this repository as a marketplace and install the plugin:

```
/plugin marketplace add kebson01/bridalteam
/plugin install bridalteam@bridalteam-tools
```

Then ask in plain words ("do the SEO for Bridal Team", "get us listed on
Product Hunt") or call a skill directly: `/bridalteam:seo-promotion`.

To try it from a local checkout without installing:

```
claude --plugin-dir ./plugins/bridalteam
```
