const utils = require('../../api/utils');
const { warnLife } = utils;
const config = require('../../api/config');
const createNode = require('./relation');
const Relations = require('../../api/relations');
const processRelationHandle = require('./processRelation');
const { connectNodes } = require('./utils');
const selectComponent = require('./selectComponent');

const getUrl = function () {
    let pages = getCurrentPages();
    let url = pages[pages.length - 1].route;
    let _arr = url.split('/');
    let _name = _arr[_arr.length - 1];
    my.setStorageSync({
        key: '_pageMsg',
        data: {
            pageName: _name,
            pagePath: url
        }
    });
    return url;
};
const getLogInfo = function () {
    let num = 0;
    let info = my.getStorageSync({
        key: '__antmove_loginfo'
    }).data.pages;
    info.forEach(function (v, i) {
        num += v.logs.length;
    });
    return num;
};

const watchShakes = function () {
    let pages = getCurrentPages();
    let url = pages[pages.length - 1].route;
    let logUrl = "pages/ant-move-runtime-logs/index"; 
    let specificUrl = "pages/ant-move-runtime-logs/specific/index";
    my.watchShake({
        success: function () { 
            let num = getLogInfo();  
            let ifWatch = my.getStorageSync({
                key: 'ifWatch'
            }).data;
            if (!ifWatch || url === logUrl || url === specificUrl || !num) {
                watchShakes();
                return false;
            }
            my.confirm({
                title: '温馨提示',
                content: `已收集了${num}条问题日志，是否查看?  (该弹窗和问题收集页面的代码由Antmove嵌入，上线时请记得去掉)`,
                confirmButtonText: '赶紧看看',
                cancelButtonText: '暂不需要',
                success: function (res) {
                    if (res.confirm) {
                        my.navigateTo({
                            url: '/pages/ant-move-runtime-logs/index'
                        });
                    }
                },
                complete: function () {
                    watchShakes();
                }
            });
        }
    }); 
};
module.exports = {
    processTransformationPage (_opts, options) {
        _opts = Object.assign(_opts, options);

        _opts.onLoad = function (res) {
            this.selectComponentApp = new selectComponent(this);
            this.selectComponentApp.connect();
            // 初始化节点树
            createNode.call(this, null, null, null, true);
            processRelations(this, Relations);
            if (typeof options.data === 'function') {
                options.data = options.data();
            }

            getUrl();
            if (config.env === "development") {
                watchShakes();
            } 
            if (options.onResize) {
                warnLife("There is no onResize life cycle", "onResize");
            }
            if (options.onLoad) {
                options.onLoad.call(this, res);
            }
        };

        _opts.onReady = function (param) {
            /**
             * for child ref
             * 
             * 当父级组件挂载后再执行父级组件传递下来的属性回调函数
             */
            this.setData({
                isMounted: true
            });

            if (options.onReady) {
                options.onReady.call(this, param);
            }
        };
    }
};


function processRelationNodes (ast = {}) {
    let $nodes = ast.$nodes;
  
    setTimeout(()=>{
      ast.mountedHandles
        .forEach(function (fn, i) {
            fn();
        });
    ast.mountedHandles = [];
    }, 500)
}


function processRelations (ctx, relationInfo = {}) {
  const relationApp = {
    fns: [],
    relationFns: []
  };
    let route = ctx.route;
    route = route.replace(/\/node_modules\/[a-z-]+\/[a-z-]+/, '')

    if (route[0] !== '/') route = '/' + route;
    
    let info = relationInfo[route] || relationInfo[route.substring(1)];
    if (info) {
        processRelationHandle(info, function (node) {
            let id = node.$id;
            ctx.$antmove = ctx.$antmove || {}
            ctx.$antmove.__refFns = ctx.$antmove.__refFns || {};
            ctx.$antmove.__refFns[node.$id] = false;
            if (id === 'saveChildRef0') {
                ctx.$antmove.__refFns[id] = true;
                ctx[id] = function () {
                node.$index = 0;
                node.$route = route;
                this.$id = this.$id || this.$viewId
                createNode.call(this, this, null, node);
                relationApp.fns.forEach((fn) => {
                 fn.call(this)
                 })

                
                 let _arr = []
                relationApp.relationFns.forEach((fn)=>{
                    if (!fn.call(this)) {
                        _arr.push(fn);
                    }
                })

                relationApp.relationFns = _arr;

                 let ast = this.$rootNode.getRootNode();
                    processRelationNodes(ast);
                ast.isPageReady = true;
                }
                return false;
            }
            ctx[id] = function (ref) {
                if (!ref) return false;
                if (!ctx.$antmove.__refFns[ref.$id]) {
                ctx.$antmove.__refFns[ref.$id] = true;

                relationApp.fns.unshift(
                  function () {
                    let ctx = this;
                    ctx.selectComponentApp.preProcesscomponents(ref);
                    ctx.$antmove = ctx.$antmove || {};
                      if (ctx.$antmove[id] === undefined) {
                          ctx.$antmove[id] = 0;
                      } else {
                          ctx.$antmove[id] += 1;
                      }
                      node.$index = ctx.$antmove[id];
                      node.$route = route;
                      createNode.call(ctx, ref, null, node);
                  }
                )

                relationApp.relationFns.push(function () {
                    return ref.handleRelations && ref.handleRelations()
                })
            
            }
                    if (ctx.saveChildRef0) {
ctx.saveChildRef0()
                    }
            };
        });
    } else {
        console.warn('Missing nodes relation of ', route);
    }
}