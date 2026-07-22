---
name: secure-ruby-gem
description: 'Set up a secure release process for a Ruby gem to protect it from supply chain attacks. Use for any request to create and publish a new gem, secure gem publishing or releasing, set up RubyGems Trusted Publishing, sigstore attestations, MFA-required gems, or Bundler cooldown, harden a gem release workflow.'
---

# Release a Ruby gem securely

Set up a release process where no RubyGems API key exists to steal, releases can come only from one CI workflow, and every release still waits for a human to approve it.

## How to run this skill

The setup is half repo files, half settings on rubygems.org and github.com that **only the user can change**. Do the repo files yourself. For the settings, produce click-by-click instructions with **direct links resolved from the repo's real data**, gem names from the gemspec, owner/repo from the gemspec metadata or the git remote, and the exact values to enter. Then wait for the user to confirm each block before verifying and moving on. Never say "go to your gem settings"; always give the resolved URL.

## What Ruby has and what it does not

Tell the user this before starting, so nobody expects npm parity:

- **No staged publishing.** RubyGems has no equivalent of `npm stage publish`. Nothing holds a pushed version in a queue for out-of-band 2FA approval. The substitute is a GitHub Actions environment with required reviewers, named in the trusted publisher itself, so the OIDC token can only be minted after a human clicks approve. That approval is a GitHub account action, not a RubyGems 2FA prompt.
- **Immutability is free.** A yanked version number can never be republished, so nobody can swap the contents of a released version.
- **MFA and CI coexist.** Trusted Publishing exists so that a gem with `rubygems_mfa_required` can still be released from CI without an API key.
- **Install-time code execution is worse than npm's.** A gem listing `extconf.rb`, `Rakefile`, or `mkrf_conf.rb` in `spec.extensions` runs arbitrary Ruby on `bundle install`. There is no `--ignore-scripts` and no per-gem allowlist. See [Step 2e](#2e-install-time-code-execution).

## Step 1: Gather facts

Collect before changing anything:

- **Gems.** Read every `*.gemspec` in the repo. A repo with more than one gemspec needs one trusted publisher per gem.
- **GitHub owner/repo.** From the gemspec `metadata["source_code_uri"]` or `homepage_uri`, falling back to `git remote get-url origin`. If neither exists, ask the user, then add `source_code_uri` to the gemspec.
- **Org or personal.** Whether the owner is a GitHub organization or a user account. It changes the 2FA instructions and whether required reviewers are available.
- **Published or not.** `curl -s -o /dev/null -w '%{http_code}' https://rubygems.org/api/v1/gems/<name>.json` for each gem. A 404 means not yet published, see [Not yet published gems](#not-yet-published-gems).
- **Tag format.** `git tag --sort=-creatordate | head`. Bundler's `rake release` produces `v1.0.0`; some repos use `1.0.0`, multi-gem repos often `<name>/v1.0.0`. Keep the existing format in the workflow trigger and the release instructions. Default to `v1.0.0` only if there are no tags yet.
- **Bundler version.** `bundle --version`. Cooldown needs Bundler 4.0.13 or newer.
- **Release tooling.** Does the Rakefile require `bundler/gem_tasks`, and does anything already run `rake release`?
- **Native extensions.** Does any gemspec set `spec.extensions`? If so, the gem itself runs code on every consumer's machine at install, which raises the bar on who may push it.
- **Existing workflows** in `.github/workflows/`, especially any current release workflow and any use of `secrets.RUBYGEMS_API_KEY` or `GEM_HOST_API_KEY`.

## Step 2: Repo changes (do these yourself)

Ask before overwriting an existing release workflow; carry over intentional extras (changelog generation, GitHub Releases) into separate jobs without `id-token`.

### 2a. `.github/workflows/publish.yaml`

The core rules, whatever the project's shape:

- Trigger on version tags, matching the repo's existing tag format (`v*`, `[0-9]*`, ...).
- **The publish job installs no Gemfile dependencies, uses no bundler cache, and no third-party actions** beyond checkout, setup-ruby, download-artifact, and `rubygems/configure-rubygems-credentials`, which RubyGems maintains. Anything running in a job with `id-token: write` can publish the gem.
- Build in a **separate job**, pass the `.gem` file via artifacts. Only the publish job gets `id-token: write`; every job gets `contents: read` and `persist-credentials: false` on checkout.
- Pin the publish job to `environment: release` and protect that environment with required reviewers, see [Step 3](#on-githubcom). This is the human gate that replaces `npm stage approve`.
- The tag already exists, since it triggered the run, so the publish job never needs `contents: write`.

Template (adapt the Ruby version, gem file name, and tag pattern to the project):

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout the repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - name: Set up Ruby
        uses: ruby/setup-ruby@a30dfa457ad68707b8b910ac3a244714b61c0626 # v1.320.0
        with:
          ruby-version: .ruby-version
          bundler-cache: true
      - name: Run tests
        run: bundle exec rake test

  build: # Separate job so build-time dependencies can't publish
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout the repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - name: Set up Ruby
        uses: ruby/setup-ruby@a30dfa457ad68707b8b910ac3a244714b61c0626 # v1.320.0
        with:
          ruby-version: .ruby-version
          bundler-cache: false # Slower, but no cache poisoning risk
      - name: Build the gem
        run: mkdir -p pkg && gem build *.gemspec --output pkg/gem.gem # -o will not create the directory
      - name: Upload the built gem
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: built-gem
          path: pkg/gem.gem
          retention-days: 1

  publish: # The critical job: no Gemfile, no bundler, one human approval
    runs-on: ubuntu-latest
    needs:
      - test
      - build
    environment: release # Required reviewers gate this job
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Download the built gem
        uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
        with:
          name: built-gem
          path: pkg/
      - name: Set up Ruby
        uses: ruby/setup-ruby@a30dfa457ad68707b8b910ac3a244714b61c0626 # v1.320.0
        with:
          ruby-version: ruby
          bundler-cache: false
      - name: Configure trusted publishing credentials
        uses: rubygems/configure-rubygems-credentials@dc5a8d8553e6ee01fc26761a49e99e733d17954a # v2.1.0
      - name: Sign the gem with sigstore
        run: gem exec sigstore-cli:0.2.3 sign pkg/gem.gem --bundle pkg/gem.sigstore.json
      - name: Push the gem
        run: gem push pkg/gem.gem --attestation pkg/gem.sigstore.json
```

There is no checkout in the publish job, because nothing there needs the source tree. If a step does need it, add checkout with `persist-credentials: false` and keep it after the artifact download.

`gem exec sigstore-cli:0.2.3` is the one install the publish job makes. Attestation signing needs the same ambient OIDC token the push does, so it cannot move to the build job without giving that job `id-token: write` and the ability to publish. Pin the version and leave it here. Drop both the sign step and `--attestation` if the user does not want sigstore provenance.

**The simpler alternative and its cost.** `rubygems/release-gem@v1` does all of this in one step and turns attestations on by default:

```yaml
      - uses: rubygems/release-gem@052cc82692552de3ef2b81fd670e41d13cba8092 # v1.4.0
```

It runs `bundle exec rake release`, so the publish job installs the full Gemfile and needs `contents: write` to push the tag. Every development dependency then sits in a job that can publish the gem. Offer it as the low-effort option, name that tradeoff, and let the user choose.

If an old workflow used `secrets.RUBYGEMS_API_KEY`, remove it from the YAML now and add secret deletion to the manual checklist in Step 3.

### 2b. Run zizmor locally and fix every finding

```bash
docker run --rm -t -v "$(pwd):/repo:ro" ghcr.io/zizmorcore/zizmor:latest /repo/.github/workflows
```

Run it yourself if Docker is available; otherwise ask the user to run this command and paste the output. Fix everything it reports in the existing workflows (`pull_request_target` misuse, shell injection, unpinned actions), then re-run until clean. Remind the user to **delete stale branches** that still contain old vulnerable workflows, because attackers exploit old branches.

### 2c. `.github/workflows/check-workflows.yaml`, keep linting on CI

```yaml
name: Lint CI workflows
on:
  push:
    branches: ['main']
  pull_request:
    branches: ['**']
jobs:
  zizmor:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
    steps:
      - name: Checkout the repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - name: Run zizmor
        uses: zizmorcore/zizmor-action@6599ee8b7a49aef6a770f63d261d214911a7ce02 # v0.6.0
        with:
          advanced-security: false
```

### 2d. Dependency cooldown

Ask the user which cooldown they want: fast (1 day) or safer (3 days). Use this fact:

> A 3-day delay before adopting new dependency versions blocks about 94% of malicious releases (median takedown is 14 hours).

Cooldown needs Bundler 4.0.13 or newer, and the unit is whole days. Check `bundle --version` first; on an older Bundler, tell the user to upgrade rather than silently skipping this step.

Set it for the project so CI and every contributor inherit it:

```bash
bundle config set cooldown 3
```

That writes `.bundle/config`, which the repo should commit. The equivalents, in order of precedence, are `bundle install --cooldown 3` on the command line, this config, and a per-source default in the `Gemfile`:

```ruby
source "https://rubygems.org", cooldown: 3
```

`BUNDLE_COOLDOWN=3` works too, for CI images that cannot commit config. Tell the user the escape hatch: `bundle install --cooldown 0` reaches the newest version for one run, which they will want the day a real security fix ships.

Cooldown applies to resolution, so it only bites on `bundle install`, `bundle update`, `bundle add`, and `bundle outdated`. It does nothing for a `Gemfile.lock` that already pins a poisoned version.

### 2e. Install-time code execution

A gem whose gemspec sets `spec.extensions` runs `extconf.rb`, `Rakefile`, or `mkrf_conf.rb` during `bundle install`, before any code is required. This is how the BufferZoneCorp gems harvested SSH keys and cloud credentials from developer machines and CI in 2026.

Ruby has no fix for this at the package manager level. There is no `--ignore-scripts` and no per-gem allowlist, so do not pretend otherwise. What actually reduces exposure:

- Cooldown from 2d, which is the single highest-value control, because most malicious versions are yanked within a day.
- Listing the gems that hold this power, so the user knows the real surface: `ruby -e 'Gem::Specification.each { |s| puts s.name if s.extensions.any? }'`.
- Keeping `bundle install` out of any CI job that holds credentials, which the Step 2a layout already does for the publish job.

If the user asks for more, vendoring dependencies or an internal gem mirror is the next step, and it is a separate project.

### 2f. Require MFA on the gem

Add to each gemspec:

```ruby
spec.metadata["rubygems_mfa_required"] = "true"
```

It takes effect from the version that carries it. Interactive pushes then need an OTP, and Trusted Publishing keeps working, which is the reason it exists. Verify on the first CI release rather than assuming: if that push is rejected, this metadata plus a misconfigured trusted publisher is the first thing to check.

## Step 3: Manual settings (walk the user through)

Present these as a numbered checklist with resolved links and exact values. Group by website. After the user confirms, verify what you can (`curl https://rubygems.org/api/v1/gems/<name>.json`, `gh api repos/<owner>/<repo>/rulesets` if `gh` is authenticated) and re-ask about the rest.

### On rubygems.org, for every gem

Repeat this block per gem, each with its own link:

> Open `https://rubygems.org/gems/<name>/trusted_publishers/new` (you must be logged in as an owner of the gem).
>
> 1. Choose **GitHub Actions** and enter:
>    - Repository owner: `<owner>`
>    - Repository name: `<repo>`
>    - Workflow filename: `publish.yaml`
>    - Environment: `release`
> 2. Set your account MFA level to **UI and API** at <https://rubygems.org/settings/edit>, under Multi-factor Authentication. Prefer a hardware key or passkey.

Filling the Environment field is what makes the human approval load-bearing. Leave it empty and RubyGems will mint a token for any run of that workflow, approved or not.

If the old setup used an API key secret, also:

> Delete the `RUBYGEMS_API_KEY` secret at `https://github.com/<owner>/<repo>/settings/secrets/actions` and revoke the key itself at <https://rubygems.org/settings/edit> under API keys.

### On github.com

**Release environment with required reviewers.** This is the manual gate:

> Open `https://github.com/<owner>/<repo>/settings/environments/new`, name it `release`, and create it. Then enable **Required reviewers** and add yourself, plus anyone else allowed to approve a release.

On a private repo this needs GitHub Pro, Team, or Enterprise. On a free private repo the environment still scopes the OIDC claim but cannot block the job, so tell the user the gate is missing and that the tag ruleset below is doing the work alone.

**2FA for everyone.** If the repo belongs to an organization:

> Open `https://github.com/organizations/<org>/settings/security` and enable **Require two-factor authentication** under Authentication security.

For a personal account, ask the user to confirm 2FA is on at <https://github.com/settings/security>, preferably with a hardware key or passkey.

**Tag ruleset.** With CI publishing, whoever can push a version tag can start a release, so restrict tag creation:

> Open `https://github.com/<owner>/<repo>/settings/rules/new?target=tag` and create:
>
> - Ruleset Name: `Tags only by admins`
> - Enforcement status: `Active`
> - Bypass list: add `Repository admins`
> - Target tags: `Include all tags`
> - Tag rules: enable **Restrict creations**

**Immutable releases.** RubyGems already refuses to republish a yanked version, so the gem itself is safe. This setting covers the GitHub Releases assets next to it:

> Open `https://github.com/<owner>/<repo>/settings` and in the **Releases** section enable **Immutable releases**.

## Not yet published gems

Unlike npm, RubyGems does not require a manual first release. A **pending trusted publisher** can be created for a name that does not exist yet:

> Open <https://rubygems.org/profile/oidc/pending_trusted_publishers/new> and enter the gem name plus the same owner, repo, workflow filename, and `release` environment as above.

The first successful push from that workflow claims the name and converts the pending publisher into a normal one. So the very first release already goes through CI, with attestations, and no API key ever exists.

Before creating it, check the name is actually free and warn about typosquatting-adjacent names.

## Multi-gem repos

- **Trusted publishers are per gem.** Every gem needs its own entry pointing at the same repo and the same `publish.yaml`. Missing one leaves that gem unprotected.
- One workflow can release everything if versions move together. If gems version independently, tag them separately (`<name>/v1.2.3`), match that in the trigger, and have the build job build only the gem named in the tag.
- `spec.metadata["rubygems_mfa_required"]` goes in every gemspec, not just the top one.

## Tell the user how to release now

End by showing the new release flow, with the tag in the repo's detected format:

```sh
# Bump the version constant and update CHANGELOG.md
git add .
git commit -m 'Release 1.0.1'
git tag v1.0.1   # `git tag -s` is better if signing keys are set up
git push origin v1.0.1
```

CI then runs tests, builds the gem, and stops at the `release` environment. The user approves the deployment on the run page, and only then does the push happen. Suggest a patch release as an end-to-end test of the pipeline.

Also tell them the recovery path, because it is unforgiving: `gem yank <name> -v 1.0.1` pulls a bad version, and that version number is gone forever. A fix ships as 1.0.2.

## Suggest the next step: fewer dependencies

Every transitive gem is attack surface no setting removes, and the ones with native extensions run code on every install. After the setup is done:

```bash
bundle list | wc -l
ruby -e 'Gem::Specification.each { |s| puts s.name if s.extensions.any? }'
```

Show the user the count and the extension gems, and offer to draft a plan (an issue or TODO) for dropping the largest branches later. Do not do the replacements now; it is a separate, larger task.

Worth adding in the same breath, since it is one line: `bundler-audit` checks `Gemfile.lock` against known advisories and belongs in the test job, not the publish job.

## Final checklist

1. `publish.yaml` pushes a prebuilt `.gem` artifact; only the publish job has `id-token: write`; it installs no Gemfile dependencies and uses no bundler cache.
2. The publish job is pinned to `environment: release`, and that environment has required reviewers.
3. zizmor workflow added and existing workflows pass it; stale branches deleted.
4. All actions pinned by SHA.
5. Cooldown configured, and the user knows extension gems still run code at install.
6. Every gem has a trusted publisher whose Environment field says `release`, confirmed by the user, per gem.
7. `rubygems_mfa_required` set in every gemspec; account MFA level is UI and API.
8. No RubyGems API key left in workflows, repo secrets, or the user's rubygems.org account.
9. Tag ruleset active; immutable releases enabled; 2FA required.
10. User knows the tag, approve, release flow and has run a test release.
