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

// http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
export function fisherYatesArrayShuffle<T>(myArray: Array<T>) {
	let i = myArray.length;
	if (i === 0) {
		return;
	}
	while (--i) {
		const j = Math.floor(Math.random() * (i + 1));
		const tempi = myArray[i];
		const tempj = myArray[j];
		myArray[i] = tempj;
		myArray[j] = tempi;
	}
}
