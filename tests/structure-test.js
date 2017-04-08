var expect = require('chai').expect
var RadixRouter = require('../index')
var _putRoute = require('./util/putRoute')

function _getChild (node, prefix) {
  for (var i = 0; i < node.children.length; i++) {
    if (node.children[i].path === prefix) {
      return node.children[i]
    }
  }
  return null
}

var WILDCARD_TYPE = 1
var PLACEHOLDER_TYPE = 2

describe('Router tree structure', function () {
  it('should be able to insert nodes correctly into the tree', function () {
    var router = new RadixRouter()
    _putRoute(router, 'hello')
    _putRoute(router, 'cool')
    _putRoute(router, 'hi')
    _putRoute(router, 'helium')
    _putRoute(router, 'coooool')
    _putRoute(router, 'chrome')
    _putRoute(router, 'choot')
    _putRoute(router, '/choot')
    _putRoute(router, '//choot')
    /**
     * Expected structure:
     *            root
     *         /        \
     *        h             c
     *      /  \         /    \
     *     i   el       oo       h
     *       /   \     / \       /  \
     *      lo  ium  l  oool   rome  oot
     */

    var hNode = _getChild(router._rootNode, 'h')
    var iNode = _getChild(hNode, 'i')
    var elNode = _getChild(hNode, 'el')
    expect(hNode.children.length).to.equal(2)
    expect(iNode.path).to.not.equal(null)
    expect(elNode.children.length).to.equal(2)
    expect(_getChild(elNode, 'lo').path).to.not.equal(null)
    expect(_getChild(elNode, 'ium').path).to.not.equal(null)

    var cNode = _getChild(router._rootNode, 'c')
    var ooNode = _getChild(cNode, 'oo')
    var h2Node = _getChild(cNode, 'h')
    expect(ooNode.children.length).to.equal(2)
    expect(h2Node.children.length).to.equal(2)
    expect(_getChild(ooNode, 'l')).to.not.equal(null)
    expect(_getChild(ooNode, 'oool')).to.not.equal(null)

    expect(_getChild(h2Node, 'rome')).to.not.equal(null)
    expect(_getChild(h2Node, 'oot')).to.not.equal(null)
  })

  it('should insert placeholder and wildcard nodes correctly into the tree', function () {
    var router = new RadixRouter()
    _putRoute(router, 'hello/:placeholder/tree')
    _putRoute(router, 'choot/choo/**')

    var helloNode = _getChild(router._rootNode, 'hello')
    var helloSlashNode = _getChild(helloNode, '/')
    var helloSlashPlaceholderNode = _getChild(helloSlashNode, ':placeholder')
    expect(helloSlashPlaceholderNode.type).to.equal(PLACEHOLDER_TYPE)

    var chootNode = _getChild(router._rootNode, 'choot')
    var chootSlashNode = _getChild(chootNode, '/')
    var chootSlashChooNode = _getChild(chootSlashNode, 'choo')
    var chootSlashChooSlashNode = _getChild(chootSlashChooNode, '/')
    var chootSlashChooSlashWildcardNode = _getChild(chootSlashChooSlashNode, '**')
    expect(chootSlashChooSlashWildcardNode.type).to.equal(WILDCARD_TYPE)
  })

  context('upon delete', function () {
    it('should merge childNodes left with no siblings with parent if parent contains no data', function () {
      var router = new RadixRouter()
      router.insert({ path: 'thisIsA' })
      router.insert({ path: 'thisIsAnotherRoute', value: 1 })
      router.insert({ path: 'thisIsAboutToGetDeleted' })

      var baseNode = _getChild(router._rootNode, 'thisIsA')
      var anotherRouteNode = _getChild(baseNode, 'notherRoute')
      var aboutToGetDeletedNode = _getChild(baseNode, 'boutToGetDeleted')

      expect(anotherRouteNode).to.exist
      expect(aboutToGetDeletedNode).to.exist

      router.delete('thisIsAboutToGetDeleted')

      var newBaseNode = _getChild(router._rootNode, 'thisIsAnotherRoute')
      expect(newBaseNode).to.exist
      expect(newBaseNode.data.value).to.equal(1)
      expect(newBaseNode.data.path).to.equal('thisIsAnotherRoute')
    })

    it('should NOT merge childNodes left with no siblings with parent if contains data', function () {
      var router = new RadixRouter()
      router.insert({ path: 'thisIsA', data: 1 })
      router.insert({ path: 'thisIsAnotherRoute' })
      router.insert({ path: 'thisIsAboutToGetDeleted' })

      var baseNode = _getChild(router._rootNode, 'thisIsA')
      var anotherRouteNode = _getChild(baseNode, 'notherRoute')
      var aboutToGetDeletedNode = _getChild(baseNode, 'boutToGetDeleted')

      expect(anotherRouteNode).to.exist
      expect(aboutToGetDeletedNode).to.exist

      router.delete('thisIsAboutToGetDeleted')

      var newBaseNode = _getChild(router._rootNode, 'thisIsAnotherRoute')
      expect(newBaseNode).to.not.exist
      var originalBaseNode = _getChild(router._rootNode, 'thisIsA')
      expect(originalBaseNode).to.exist
      var originalAnotherRouteNode = _getChild(baseNode, 'notherRoute')
      expect(originalAnotherRouteNode).to.exist
    })

    it('should merge childNodes with parent if parent is a slash separator', function () {
      var router = new RadixRouter()
      router.insert({ path: 'thisIsA/', data: 1 })
      router.insert({ path: 'thisIsA/notherRoute' })
      router.insert({ path: 'thisIsA/boutToGetDeleted' })

      var baseNode = _getChild(router._rootNode, 'thisIsA')
      var slashNode = _getChild(baseNode, '/')
      var anotherRouteNode = _getChild(slashNode, 'notherRoute')
      var aboutToGetDeletedNode = _getChild(slashNode, 'boutToGetDeleted')

      expect(anotherRouteNode).to.exist
      expect(aboutToGetDeletedNode).to.exist

      router.delete('thisIsA/boutToGetDeleted')

      var originalBaseNode = _getChild(router._rootNode, 'thisIsA')
      expect(originalBaseNode).to.exist
      var originalAnotherRouteNode = _getChild(slashNode, 'notherRoute')
      expect(originalAnotherRouteNode).to.exist
    })
  })
})
