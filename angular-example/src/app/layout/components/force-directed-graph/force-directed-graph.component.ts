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

import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Runtime, Inspector, Library } from '@observablehq/runtime';
import { FormControl, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { REGEXES } from 'src/app/shared/constants';
import defineFdGraph from './force-directed-graph.notebook';
import { RoutesService } from '../../../shared/services/routes.service';

@Component({
  selector: 'app-force-directed-graph',
  templateUrl: './force-directed-graph.component.html',
  styleUrls: ['./force-directed-graph.component.scss'],
})
export class ForceDirectedGraphComponent implements AfterViewInit {
  constructor(private routesService: RoutesService) {}

  @ViewChild('fdGraph') fdGraph: ElementRef;

  loading = true;

  airportsForm = new FormGroup({
    airportId: new FormControl(environment.initialState.fdGraph.airportId),
  });

  /**
   * Component lifecycle - AfterViewInit
   */
  ngAfterViewInit(): void {
    // Create an ObservableHQ Runtime and add
    //  custom values to the Runtime, on top of the standard Observable Library objects
    const runtime = new Runtime(
      Object.assign(new Library(), {
        routesService: this.routesService,
        airportId: this.airportsForm.get('airportId').value,
      })
    );

    // FORCE DIRECTED GRAPH MODULE
    // Create an ObservableHQ module for the new runtime, importing the module's defining
    // function from another file
    runtime.module(defineFdGraph, (name) => {
      if (name === 'chart') {
        return new Inspector(this.fdGraph.nativeElement);
      }
      return null;
    });

    // Subscribe to Form changes and redefine the data source when the input changes
    this.airportsForm.get('airportId').valueChanges.subscribe((airportId) => {
      if (ForceDirectedGraphComponent.isValidAirportId(airportId)) {
        this.refreshTree(runtime);
      }
    });
  }

  /**
   * Refresh the tree
   * @param runtime Runtime object
   */
  refreshTree(runtime): any {
    const module = runtime.module(defineFdGraph);
    module.redefine('data', ['routesService'], (routesService) =>
      routesService.getRoutesFromAirport(this.airportsForm.get('airportId').value)
    );
  }

  /**
   * Check it is a valid airport ID
   * @param bankId string to test
   */
  static isValidAirportId(airportId: string): boolean {
    return new RegExp(REGEXES.REGEX_AIRPORT_ID).test(airportId);
  }

  /**
   * Clear button on Airport ID input
   */
  clearAirportId(): void {
    this.airportsForm.get('airportId').setValue('');
  }
}
