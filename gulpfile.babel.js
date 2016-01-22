import url from 'url';

import gulp from 'gulp';
import u from 'gulp-util';
import gulpLoadPlugins from 'gulp-load-plugins';

import browserSync from 'browser-sync';
import del from 'del';
import map from 'vinyl-map';
import nunjucks from 'nunjucks';
import quaff from 'quaff';
import runSequence from 'run-sequence';
import slug from 'slug';
import stripAnsi from 'strip-ansi';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import yargs from 'yargs';

const $ = gulpLoadPlugins();
const args = yargs.argv;
const bs = browserSync.create();

import config from './config';
const data = quaff(config.dataFolder);

import webpackConfig from './webpack.config';
if (args.production) {
  webpackConfig.debug = false;
  webpackConfig.devtool = 'source-map';
  webpackConfig.plugins.push(
    new webpack.optimize.UglifyJsPlugin()
  );
}
const webpackBundle = webpack(webpackConfig);

webpackBundle.plugin('done', (stats) => {
  if (stats.hasErrors() || stats.hasWarnings()) {
    return bs.sockets.emit('fullscreen:message', {
      title: 'Webpack Error:',
      body: stripAnsi(stats.toString()),
      timeout: 100000
    });
  }

  bs.reload();
});

gulp.task('scripts', (cb) => {
  webpackBundle.run((err, stats) => {
    if (err) throw new u.PluginError('webpack', err);
    u.log('[webpack]', stats.toString({colors: true}));

    cb();
  });
});

gulp.task('styles', () => {
  return gulp.src('./app/styles/*.scss')
    .pipe($.newer('./.tmp/styles'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: ['node_modules'],
      precision: 10
    }).on('error', $.sass.logError))
    .pipe($.cssnano({
      autoprefixer: {
        browsers: ['last 2 versions']
      },
      discardComments: {
        removeAll: true
      }
    }))
    .pipe($.sourcemaps.write(args.production ? '.' : undefined))
    .pipe(gulp.dest('./.tmp/styles'))
    .pipe($.if(args.production, gulp.dest('./dist/styles')))
    .pipe(bs.stream({match: '**/*.css'}))
    .pipe($.size({title: 'styles'}));
});

let basePath = args.production ? url.resolve('/', config.deploy.key) + '/' : '/';
data.PATH_PREFIX = basePath;

let fullPath = url.format({
  protocol: 'http',
  host: config.deploy.bucket,
  pathname: config.deploy.key
}) + '/';
data.PATH_FULL = fullPath;

let env = nunjucks.configure(config.templateFolder, {
  autoescape: false
});

env.addFilter('widont', (str) => {
  let lastSpace = str.trim().lastIndexOf(' ');

  return str.substring(0, lastSpace) + '&nbsp;' + str.substring(lastSpace + 1);
});


env.addFilter('slugify', (str) => {
  return slug(str);
});

gulp.task('templates', () => {
  let nunjuckify = map((code, filename) => {
    return env.renderString(code.toString(), {data: data})
  })

  // All .html files are valid, unless they are found in templates
  return gulp.src(['./app/**/*.html', `!${config.templateFolder}/**`])
    .pipe(nunjuckify)
    .pipe(gulp.dest('./.tmp'))
    .pipe($.if(args.production, $.htmlmin({collapseWhitespace: true})))
    .pipe($.if(args.production, gulp.dest('./dist')))
    .pipe($.size({title: 'templates', showFiles: true}));
})

gulp.task('templates-watch', ['templates'], cb => bs.reload());

gulp.task('images', () => {
  return gulp.src('./app/assets/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('./dist/assets/images'))
    .pipe($.size({title: 'images'}));
});

gulp.task('clean', cb => {
  return del(['./.tmp/**', './dist/**', '!dist/.git'], {dot: true}, cb);
});

gulp.task('serve', ['styles', 'templates'], () => {
  bs.init({
    logConnections: true,
    logPrefix: 'NEWSAPPS',
    middleware: [
      webpackDevMiddleware(webpackBundle, {
        publicPath: webpackConfig.output.publicPath,
        stats: {colors: true}
      })
    ],
    notify: false,
    open: false,
    plugins: ['bs-fullscreen-message'],
    port: 3000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  });

  gulp.watch(['./app/styles/**/*.scss'], ['styles']);
  gulp.watch('./app/**/*.html', ['templates-watch']);
});

gulp.task('rev', () => {
  return gulp.src(['./dist/**/*.css', './dist/**/*.js', './dist/assets/images/**/*'], { base: './dist' })
    .pipe($.rev())
    .pipe(gulp.dest('./dist'))
    .pipe($.rev.manifest())
    .pipe(gulp.dest('./dist'));
});

gulp.task('revreplace', ['rev'], () => {
  var manifest = gulp.src('./dist/rev-manifest.json');

  return gulp.src('./dist/**/*.html')
    .pipe($.revReplace({manifest: manifest}))
    .pipe(gulp.dest('./dist'));
});

gulp.task('gzip', () => {
  return gulp.src('./dist/**/*.{html,js,css,json,eot,ttf,svg}')
    .pipe($.gzip({append: false}))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['clean'], cb => {
  runSequence(['images', 'scripts', 'styles', 'templates'], ['revreplace'], ['gzip'], cb);
});

gulp.task('build', ['default']);
