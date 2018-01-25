export function* waitMs(duration: number): IterableIterator<void> {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		const deltaTime: number = yield;
		elapsedTime += deltaTime;
	}

	return elapsedTime;
}

export function* range(from: number, to: number): IterableIterator<number> {
	for (let i = from; i < to; ++i) {
		yield i;
	}
}

export function randomElement<T>(array: ReadonlyArray<T>) {
	return array[Math.floor(Math.random() * array.length)] as T | undefined;
}
