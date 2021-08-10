/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { GraphData, NodeType, LinkType } from 'src/app/shared/models/graph.model';
import { RoutesService } from 'src/app/shared/services/routes.service';

/**
 * Notebook Module defining function for the Collapsible Tree View
 * Based on https://observablehq.com/@d3/disjoint-force-directed-graph?collection=@d3/d3-force
 *
 * @param runtime Runtime
 * @param observer Observer
 */
export default function defineFdGraph(runtime, observer): any {
  // Create a new module
  const main = runtime.module();

  // Load all variables
  main.variable(observer('md')).define(
    '',
    ['md'],
    (md) => md`

    `
  );
  main
    .variable(observer('chart'))
    .define(
      'chart',
      ['data', 'd3', 'width', 'height', 'types', 'color', 'location', 'drag', 'linkArc', 'invalidation'],
      (
        data: GraphData,
        d3,
        width: number,
        height: number,
        types: string[],
        color,
        location: string,
        drag,
        linkArc,
        invalidation
      ) => {
        // Map data to D3
        const links = data.links.map((d) => Object.create(d));
        const nodes = data.nodes.map((d) => Object.create(d));

        // Create the simulation
        const simulation = d3
          .forceSimulation(nodes)
          .force(
            'link',
            d3.forceLink(links).id((d) => d.id)
          )
          .force('charge', d3.forceManyBody().strength(-400))
          .force('x', d3.forceX())
          .force('y', d3.forceY());

        const svg = d3
          .create('svg')
          .attr('viewBox', [-width / 2, -height / 2, width, height])
          .style('font', '12px sans-serif');

        // Per-type markers, as they don't inherit styles.
        svg
          .append('defs')
          .selectAll('marker')
          .data(types)
          .join('marker')
          .attr('id', (d) => `arrow-${d.toLowerCase()}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 15)
          .attr('refY', -0.5)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('fill', (d) => color(d.toLowerCase()))
          .attr('d', 'M0,-5L10,0L0,5');

        const link = svg
          .append('g')
          .attr('fill', 'none')
          .attr('stroke-width', 1.5)
          .selectAll('path')
          .data(links)
          .join('path')
          .attr('stroke', (d) => color(d.type))
          .attr('marker-end', (d) => `url(${new URL(`#arrow-${d.type}`, location)})`);

        const node = svg
          .append('g')
          .attr('fill', 'currentColor')
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .selectAll('g')
          .data(nodes)
          .join('g')
          .call(drag(simulation));

        node
          .append('circle')
          .attr('stroke', 'white')
          .attr('fill', (d) => (d.type === NodeType.AIRPORT ? '#1f77b4' : '#ff7f0e'))
          .attr('stroke-width', 1.5)
          .attr('r', (d) => (d.type === NodeType.AIRPORT ? 6 : 3));

        node
          .append('text')
          .attr('x', 8)
          .attr('y', '0.31em')
          .attr('font-weight', (d) => (d.type === NodeType.AIRPORT ? 'bold' : 'normal'))
          .attr('fill', (d) => (d.type === NodeType.AIRPORT ? '#1f77b4' : '#ff7f0e'))
          .text((d) => d.displayName)
          .clone(true)
          .lower()
          .attr('stroke', 'white')
          .attr('stroke-width', 3);

        simulation.on('tick', () => {
          link.attr('d', linkArc);
          node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });

        invalidation.then(() => simulation.stop());
        return svg.node();
      }
    );
  main.variable(observer('linkArc')).define(
    'linkArc',
    [],
    () =>
      function linkArc(d): any {
        const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
        return `
          M${d.source.x},${d.source.y}
          A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
        `;
      }
  );
  main.variable(observer('types')).define('types', [], () => Object.keys(LinkType));
  main
    .variable(observer('data'))
    .define('data', ['routesService', 'airportId'], (routesService: RoutesService, airportId: string) =>
      routesService.getRoutesFromAirport(airportId)
    );
  main.variable(observer('height')).define('height', [], () => 1000);
  main
    .variable(observer('color'))
    .define('color', ['d3', 'types'], (d3, types) => d3.scaleOrdinal(types, d3.schemeCategory10));
  main.variable(observer('drag')).define('drag', ['d3'], (d3) => (simulation) => {
    function dragstarted(event, d): any {
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d): any {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d): any {
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    }

    return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
  });
  main.variable(observer('d3')).define('d3', ['require'], (require) => require('d3@6'));
  return main;
}
