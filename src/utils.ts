import { spawnSync, StdioOptions } from 'child_process';

function exec(cmd: string, args: string, stdio: StdioOptions) {
	const result = spawnSync(cmd, args.split(' '), {
		encoding: 'utf8',
		stdio,
	});
	const { error, stdout } = result;
	let { status } = result;
	if (error) {
		console.log(error.stack);
		status = 1;
	}
	if (status) {
		process.exitCode = status;
	} else {
		process.exitCode = 0;
	}
	return stdout;
}

export function git(args: string): string {
	return exec('git', args, 'pipe');
}

export function gitMultilineResults(args: string) {
	return git(args)
		.split('\n')
		.filter(line => !!line);
}
