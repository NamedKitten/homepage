const path = require('path');
const url = require('url');
const gulp = require('gulp');
const del = require('del');
const merge = require('merge-options');
const Html = require('./html');
const Css = require('./css');
const Img = require('./img');
const Files = require('./files');
const defaults = {
    cwd: process.cwd(),
    url: 'http://localhost',
    src: 'src',
    dest: 'build',
    server: {
        open: false,
        reloadOnRestart: true,
        reloadThrottle: 1000,
        notify: false,
        watchOptions: {
            ignoreInitial: true,
            ignored: '.DS_Store'
        }
    }
};

class sitegen {
    static create(config) {
        return new sitegen(config);
    }

    constructor(config = {}) {
        this.tasks = {};
        this.dev = process.env.NODE_ENV !== 'production';
        this.config = merge(defaults, config);

        const parsedUrl = url.parse(this.config.url);

        this.paths = {
            cwd: this.config.cwd,
            baseUrl: parsedUrl.protocol + '//' + parsedUrl.host,
            path: parsedUrl.pathname || '/',
            src: path.join(this.config.cwd, this.config.src),
            dest: path.join(this.config.cwd, this.config.dest)
        };

        this.config.server.watchOptions.cwd = this.paths.cwd;
        this.config.server.server = this.paths.dest;
        this.paths.dest = path.join(this.paths.dest, this.paths.path);
    }

    gulp() {
        return gulp;
    }

    path() {
        return getPath(this.paths.cwd, Array.prototype.slice.call(arguments));
    }

    src() {
        return getPath(this.paths.src, Array.prototype.slice.call(arguments));
    }

    dest(dir) {
        return getPath(this.paths.dest, Array.prototype.slice.call(arguments));
    }

    url() {
        return getPath(
            this.paths.path,
            Array.prototype.slice.call(arguments)
        ).replace(/\\/g, '/');
    }

    fullUrl() {
        return this.paths.baseUrl + this.url.apply(this, arguments);
    }

    clear(dir = '') {
        if (!Array.isArray(dir)) {
            dir = [dir];
        }

        return del(
            dir.map(file => path.join(this.config.cwd, this.config.dest, file))
        );
    }

    /**
     * Tasks
     */
    html(options = {}) {
        return initTask(this, Html, { task: 'html' }, options);
    }

    css(options = {}) {
        return initTask(this, Css, { task: 'css' }, options);
    }

    img(options = {}) {
        return initTask(this, Img, { task: 'img' }, options);
    }

    files(options = {}) {
        return initTask(this, Files, { task: 'files' }, options);
    }
}

module.exports = sitegen;

function initTask(sitegen, Task, defaults, options = {}) {
    const task = new Task(sitegen, merge(defaults, options));
    sitegen.tasks[task.options.task] = task;

    return task.src();
}

function getPath(absolute, args) {
    if (!args.length) {
        return absolute;
    }

    args.unshift(absolute);

    return path.join.apply(null, args);
}
