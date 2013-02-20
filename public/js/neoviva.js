var colors = [
    0x1f77b4ff, 0xaec7e8ff,
    0xff7f0eff, 0xffbb78ff,
    0x2ca02cff, 0x98df8aff,
    0xd62728ff, 0xff9896ff,
    0x9467bdff, 0xc5b0d5ff,
    0x8c564bff, 0xc49c94ff,
    0xe377c2ff, 0xf7b6d2ff,
    0x7f7f7fff, 0xc7c7c7ff,
    0xbcbd22ff, 0xdbdb8dff,
    0x17becfff, 0x9edae5ff];

function addNeo(graph, data) {
    function addNode(id) {
        var node = graph.getNode(id);
        if (!node) node = graph.addNode(id, {twid:id});
        return node;
    }

    if (!data) data = gon;

    var source = data.edges[0].source;
    addNode(source);

    for (n in data.nodes) {
        addNode(data.nodes[n].target);
    }

    var targets = [];

    for (n in data.edges) {
        targets.push(data.edges[n].target);
    }

    graph.forEachLinkedNode(source, function (node, link) {
        var idx = targets.indexOf(node.id);
        if (idx != -1) targets.splice(idx, 1);
    });

    for (n in targets) {
        graph.addLink(source, targets[n]);
    }

}

function onLoad() {
    var graph = Viva.Graph.graph();

    var layout = Viva.Graph.Layout.forceDirected(graph, {
        springLength:100,
        springCoeff:0.0001,
        dragCoeff:0.02,
        gravity:-1
    });

    var graphics = Viva.Graph.View.webglGraphics();
    var timeout;
    var inputs = Viva.Graph.webglInputEvents(graphics, graph);
    var lastNode = null;

    graphics.setNodeProgram(new Viva.Graph.View.webglImageNodeProgram())
    graphics
        .node(function (node) {
            return Viva.Graph.View.webglImage(12, "/image/" + node["id"]);
        })
        .link(function (link) {
            var t = Viva.Graph.View.webglLine(3014898687);
            return t.oldColor = 3014898687, t
        });

    var renderer = Viva.Graph.View.renderer(graph,
        {
            layout:layout,
            graphics:graphics,
            container:document.getElementById('graph1'),
            renderLinks:true
        });


    var onMouseEnter = function(node) {
        clearTimeout(timeout);
        timeout = setTimeout(function() { showBox(node);},250);
    }

    var showBox = function (node) {
        var t = $("#hoveredName").empty();
        if (!node) return;
        var id = node['id'];
        if (id.match(/^::/)) {
            id = "#" + id.substring(2);
            t.text(id).append(n).show();
        } else {
            var n = '<br/><a href="http://twitter.com/' + id + '" target="_blank"><img id="avatar" src="http://api.twitter.com/1/users/profile_image?screen_name=' + id + '&size=bigger"' + '></img></a>';
            t.empty().text("@" + id).append(n).show()
        }
        $.ajax("/tweets/" + node['id'], {
            type:"GET",
            dataType:"json",
            success:function (res) {
                console.log("tweets", res);
                for (var n in res) {
                    $("<div>" + res[n].text + "</div>").appendTo(t)
                }
            }});
    };
    var onMouseLeave = function () {
        $("#hoveredName").hide().empty()
        clearTimeout(timeout);
    };

    var onClick = function (node) {
        console.log("click", node)
        showBox(node);
        graphics.graphCenterChanged(node.position.x,node.position.y);
        renderer.rerender()
        $.ajax("/edges/" + node.id, {
            type:"GET",
            dataType:"json",
            success:function (res) {
                console.log(res);
                addNeo(graph, {edges:res});
            }
        })
    };
    var onDblClick = function (node) {
        console.log("double-click", node)
    };

    var unHighlightLinks = function (node, color) {
        if (node && node.id) {
            node.ui.size=12;
            graph.forEachLinkedNode(node.id, function (aNode, link) {
                link.ui.color = color || link.ui.oldColor
            })
        }
    };
    var highlightNode = function(node, color) {
        if (!(node && node.id && node.ui)) return;
        node.ui.size=36;
        graph.forEachLinkedNode(node.id, function (aNode, link) {
            link.ui.color = color || 4278190335;
            graphics.bringLinkToFront(link.ui)
        })
    }

    inputs.mouseEnter(function (node) {
        onMouseEnter(node)
        unHighlightLinks(lastNode)
        lastNode = node
        highlightNode(node)
        renderer.rerender()
    }).mouseLeave(function (node) {
            onMouseLeave()
            unHighlightLinks(lastNode)
            lastNode = null
            unHighlightLinks(node)
            renderer.rerender()
        }).dblClick(function (node) {
            onDblClick(node)
        }).click(function (node) {
            onClick(node)
        })


    renderer.run();
    addNeo(graph);
    l = layout;
}