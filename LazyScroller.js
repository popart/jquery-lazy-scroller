/** Lazy Scroller 
    opts {
        scrollContainer: main container, 
        contentContainer: where the tiles go,
        data: JSON data,
        numCols: # of items wide,
        template: jquery template,
        tileHeight: measure the diff b/t two item.offset().top, (sorry, can't get dom attrs from <script> tmpl)
        beforeLoad: function(itemData: JSON),
        afterLoad: function(itemData: JSON, itemTile: html),
    }
*/

LazyScroller = function(opts) { 
    var scrollContainer = opts.scrollContainer
    if(opts.contentContainer) {
        var contentContainer = opts.contentContainer
    } else {
        var contentContainer = $('<div>')
        scrollContainer.append(contentContainer)
    }
    if(opts.windowContainer) {
        var windowContainer = opts.windowContainer
    } else {
        var windowContainer = $('<div>')
        contentContainer.append(windowContainer)
    }

    var items = opts.data
    var template = opts.template
    var numCols = opts.numCols || 1

    var HIDDEN_OFFSET = _getHiddenOffset(scrollContainer) //may not necessarily be a constant
    var BASE_CEILING = _getCeiling()

    var TILE_HEIGHT = opts.tileHeight
    var START_TOP = contentContainer.offset().top
    var HEIGHT_DIFF = START_TOP - BASE_CEILING

    if (opts.beforeLoad) {
        setBeforeLoad(opts.beforeLoad)
    }
    if (opts.afterLoad) {
        setAfterLoad(opts.afterLoad)
    }

    contentContainer.height(Math.ceil(items.length/numCols)*TILE_HEIGHT)

    _lazyLoad()

    opts.scrollContainer.scroll(function() {
        _setWindowOffset()
        _lazyLoad()
    })


    function _getHiddenOffset(container) {
        var borderTopWidth = Number(scrollContainer.css('border-top-width').match(/\d+/))
        var paddingTop = Number(scrollContainer.css('padding-top').match(/\d+/))
        return borderTopWidth + paddingTop
    }

    function _getCeiling() {
        return scrollContainer.offset().top + HIDDEN_OFFSET
    }

    function _setWindowOffset() {
        windowContainer.offset({
            top: contentContainer.offset().top + scrollContainer.scrollTop() - scrollContainer.scrollTop() % TILE_HEIGHT,
            left: contentContainer.offset().left
        })
    }

    function _lazyLoad() {
        var ceiling = _getCeiling()
        var floor = ceiling+scrollContainer.height()
        var scrollTop = scrollContainer.scrollTop()
        var movement = ceiling - BASE_CEILING

        windowContainer.html(''); 

        for (var i in items) {
            var tileTop = START_TOP - scrollTop + HEIGHT_DIFF + ~~(i/numCols)*(TILE_HEIGHT) + movement
            var tileBottom = tileTop + TILE_HEIGHT
            if (floor > tileTop) {
                if (ceiling < tileBottom) {
                    beforeLoad(items[i], i)
                    var tile = template.tmpl(items[i])
                    windowContainer.append(tile)
                    afterLoad(items[i], tile, i)
                } 
            } else return false;
        }
    }

    function getData() {
        return opts.data
    }

    function resetData(data) {
        items = data
        contentContainer.height(Math.ceil(items.length/numCols)*TILE_HEIGHT)
        scrollContainer.scrollTop(0)
    }

    function beforeLoad(itemData, index) {}
    function afterLoad(itemData, itemTile, index) {}

    function setBeforeLoad(fun) {
        beforeLoad = fun
    }
    function setAfterLoad(fun) {
        afterLoad = fun
    }

    return {
        resetData: resetData
        , getData: getData
        , setBeforeLoad: setBeforeLoad
        , setAfterLoad: setAfterLoad
        , reload: _lazyLoad
    }
    
}
