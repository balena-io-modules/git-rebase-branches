# git-rebase-branches

A simple script for rebasing your recent git branches.

This is an attempt to automate a bit the process of rebasing all your unmerged recent (2 months old max) local branches.
Branches that can't be rebased automatically are not affected at all.

## Get started

1. Stash your local changes
2. Run `npx git-rebase-branches`

## Arguments

### --push

Also runs `git push origin <BRANCH_NAME> --force-with-lease` on all successfully rebased branches.

Hint: User `git config credential.helper 'cache --timeout=300'` to add some caching for your git credentials.
Otherwise you will be asked for your credentials before each subsequent push.
