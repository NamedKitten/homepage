const path = require('path');
const { Transform } = require('stream');
const merge = require('merge-options');
const TaskFork = require('./task-fork');
const defaults = {
    base: ''
};

class Task {
    constructor(sitegen, options = {}) {
        this.sitegen = sitegen;
        this.options = merge(
            defaults,
            { watchPattern: options.pattern },
            options
        );
        this.watch = [];
        this.reload = '*';

        if (this.options.src) {
            if (!path.isAbsolute(this.options.src)) {
                this.options.src = this.sitegen.src(this.options.src);
            }

            this.cwd = path.join(this.options.src, this.options.base);
        } else {
            this.cwd = this.sitegen.src(this.options.base);
        }
    }

    src() {
        if (this.options.watchPattern) {
            this.watchSrc(this.options.watchPattern);
        }

        let src;
        if (Array.isArray(this.options.pattern)) {
            src = this.options.pattern.map(pattern =>
                path.join(this.cwd, pattern)
            );
        } else {
            src = path.join(this.cwd, this.options.pattern);
        }

        this.stream = this.sitegen.gulp().src(src, {
            base: this.cwd,
            since: this.options.incremental
                ? this.sitegen.gulp().lastRun(this.options.task)
                : undefined
        });

        return this;
    }

    pipe(plugin) {
        this.stream = this.stream
            .pipe(plugin)
            .on('error', this.logError.bind(this));

        return this;
    }

    each(fn, data = {}) {
        const files = [];

        return this.pipe(
            new Transform({
                objectMode: true,
                transform(file, encoding, done) {
                    fn(file, data);
                    files.push(file);
                    done();
                },
                flush(done) {
                    files.forEach(file => this.push(file));
                    done();
                }
            })
        );
    }

    filter(fn) {
        return this.pipe(
            new Transform({
                objectMode: true,
                transform(file, encoding, done) {
                    if (fn(file)) {
                        done(null, file);
                    } else {
                        done();
                    }
                }
            })
        );
    }

    fork(fn) {
        return new TaskFork(this, fn);
    }

    add(options = {}) {
        options.incremental = false;
        return new TaskFork(this.sitegen.html(options), this);
    }

    dest(dir) {
        if (!dir || !path.isAbsolute(dir)) {
            dir = this.sitegen.dest(dir || this.options.base);
        } else {
            dir = path.join(dir, this.options.base);
        }

        return new Promise((resolve, reject) => {
            this.pipe(this.sitegen.gulp().dest(dir));

            this.stream.on('end', () => {
                resolve();
            });
        });
    }

    watchSrc(pattern) {
        if (Array.isArray(pattern)) {
            this.watch = this.watch.concat(
                pattern.map(pattern => path.join(this.cwd, pattern))
            );
            return;
        }

        this.watch.push(path.join(this.cwd, pattern));

        return this;
    }

    logError(err) {
        console.error(`Error from "${this.options.task}" task:`);
        console.error(err.toString());
    }
}

module.exports = Task;
