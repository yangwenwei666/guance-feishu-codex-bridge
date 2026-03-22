export class SerialTaskQueue {
  #tail = Promise.resolve();
  #pending = 0;

  get pending() {
    return this.#pending;
  }

  enqueue(task) {
    const position = this.#pending + 1;
    this.#pending += 1;

    const run = this.#tail
      .catch(() => {})
      .then(task)
      .finally(() => {
        this.#pending = Math.max(0, this.#pending - 1);
      });

    this.#tail = run.catch(() => {});
    return { position, promise: run };
  }
}
