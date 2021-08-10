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

import { Injectable } from '@angular/core';
import { gql } from 'apollo-angular';
import { GraphqlService } from 'src/app/shared/graphql/graphql.service';
import { NGXLogger } from 'ngx-logger';
import { Link, LinkType, NodeType, GraphData } from '../models/graph.model';
import { REGEXES } from '../constants';
import { GraphQlQuery } from '../models/graphql.model';

@Injectable({
  providedIn: 'root',
})
export class RoutesService {
  constructor(private graphqlService: GraphqlService, private logger: NGXLogger) {}

  /**
   * Retrieve a graph of routes coming out of a specific airport
   * Used by the Force Directed Graph
   * @param airportId ID of the airport
   */
  async getRoutesFromAirport(airportId: string): Promise<any> {
    // Construct GraphQL Query
    const options: GraphQlQuery = {
      query: gql`
        query myQuery($airportId: ID!) {
          getRoutes(airportId: $airportId)
        }
      `,
      variables: {
        airportId,
      },
    };
    // Query GraphQL Endpoint
    const promise = new Promise((resolve, reject) => {
      this.graphqlService.get(options).subscribe((backendData: any) => {
        if (backendData.data) {
          // Parse data into something D3 can understand
          resolve(RoutesService.parseGraphData(backendData.data));
        } else {
          this.logger.error('No data retrieved from backend');
          reject(new Error('No data retrieved from backend'));
        }
      });
    });
    return promise;
  }

  /** ****************************************************************************
   * PRIVATE METHODS
   ***************************************************************************** */

  /**
   * Get Graph data from an unparsed string
   * @param data Data returned from a backend endpoint
   */
  private static parseGraphData(data: string): GraphData {
    const paths = RoutesService.parsePathsList(data);

    const links: Link[] = [];

    // Get unique edges (using set as a string)
    const airports: Set<string> = new Set();
    paths.forEach((path: string[]) => {
      links.push({
        source: path[0],
        target: path[1],
        type: LinkType.ROUTE,
      });
      airports.add(path[0]);
      airports.add(path[1]);
    });

    const nodes = Array.from(airports).map((airport) => ({
      id: airport,
      displayName: airport,
      type: NodeType.AIRPORT,
    }));
    return {
      nodes,
      links,
    };
  }

  /**
   * Parse the returned data to retrieve a list of paths
   * @param pathsData String returned from GraphQL
   */
  private static parsePathsList(pathsData: any): any {
    const paths = [];
    if (!pathsData || !pathsData.getRoutes) {
      return [];
    }
    let match;
    const regex = REGEXES.REGEX_AIRROUTES;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(pathsData.getRoutes)) !== null) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex += 1;
      }
      if (match.length >= 1) {
        const path = match[1].split(',').map((airportCode) => airportCode.trim());
        paths.push(path);
      }
    }

    return paths;
  }
}
