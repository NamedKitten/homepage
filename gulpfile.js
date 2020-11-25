const zume = require('./zume').create({dest: "docs"});
const gulp = zume.gulp();

gulp.task('clear', () => zume.clear());

gulp.task('html', () => 
    zume.html()
        .frontMatter()
        .ejsmd()
        .markdown()
        .permalink()
        .ejs()
        .inline({dest: true})
        .dest()
);

gulp.task('css', () => zume.css().sass().dest());
gulp.task('img', () => zume.img().dest());
gulp.task('files', () => zume.files({src: 'files'}).dest());

gulp.task('default', gulp.series('clear', 'css', 'img', 'files', 'html'));
gulp.task('server', gulp.series('default', () => zume.serve()));
