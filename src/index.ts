import * as dateFns from 'date-fns';
import { git, gitMultilineResults } from './utils';

const showHelp = () => {
	console.log('git-rebase-branches');
	console.log('git-rebase-branches --sinceMonths 2');
	console.log('git-rebase-branches --push');
	console.log('git-rebase-branches --help');
	process.exit(0);
};

(() => {
	const argvSet = new Set(process.argv.slice(2, Infinity));
	if (argvSet.has('--help')) {
		showHelp();
	}
})();

const params: string[] = [];
const flagsWithParams = new Set(['sinceMonths']);
const flags: Record<string, unknown> = {};

for (let i = 2; i < process.argv.length; i++) {
	if (typeof process.argv[i] === 'string' && process.argv[i].startsWith('--')) {
		const flagName = process.argv[i].slice(2);
		if (flagsWithParams.has(flagName)) {
			const value = process.argv[i + 1];
			flags[flagName] = value;
			i++;
		} else {
			flags[flagName] = true;
		}
	} else {
		params.push(process.argv[i]);
	}
}

const [currentUser] = gitMultilineResults('config user.email');
console.log(`git config user.email: "${currentUser}"`);

const [currentBranch] = gitMultilineResults('rev-parse --abbrev-ref HEAD');

if (currentBranch !== 'master') {
	console.log('checkout master');
	git('checkout master');
}

let branchList = gitMultilineResults(
	`branch --sort=-committerdate --format='%(refname:short)|%(committerdate:iso)|%(authoremail)' --no-merged`,
);
const splitBranchInfoRegex = /^([^|]+)\|([^|]+)\|<(.*)>$/;

const sinceMonths =
	typeof flags.sinceMonths === 'string' ? parseInt(flags.sinceMonths, 10) : 2;
branchList = branchList
	.map(line => {
		line = line.replace(/^'/, '').replace(/'$/, '');
		const res = splitBranchInfoRegex.exec(line);

		if (!res || res[3] !== currentUser) {
			return;
		}

		const commitDate = new Date(res[2]);
		if (
			!dateFns.isAfter(commitDate, dateFns.subMonths(new Date(), sinceMonths))
		) {
			return;
		}

		const branchName = res[1];
		// Do not include git branches that look like backups
		// or use `/` to look like they belong to branch folders
		if (branchName.includes('/') || /\bbak\b/.test(branchName)) {
			return;
		}

		return branchName;
	})
	.filter(branchName => branchName) as string[];

console.log(branchList);

const succeded = [];
const failed = [];

for (const branchName of branchList) {
	console.log(`rebasing ${branchName}`);
	git(`checkout ${branchName}`);
	if (process.exitCode) {
		console.error('checkout failed with exit code', process.exitCode);
		failed.push(branchName);
		continue;
	}

	git('rebase origin/master');
	if (process.exitCode) {
		console.error('rebase failed with exit code', process.exitCode);
		git('rebase --abort');
		failed.push(branchName);
		continue;
	}

	succeded.push(branchName);
}

console.log('');
if (failed.length) {
	console.error('Failed to rebase:');
	failed.forEach(branch => console.error(`* ${branch}`));
} else {
	console.info('All rebased!');
}

if (currentBranch !== 'master') {
	console.log(`\ncheckout ${currentBranch}`);
	git(`checkout ${currentBranch}`);
}

console.log('');
if (flags.push) {
	for (const branchName of succeded) {
		console.log(`git push origin ${branchName} --force-with-lease`);
		git(`push origin ${branchName} --force-with-lease`);
	}
}
