#
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#


import logging
from gremlin_python import statics
from gremlin_python.structure.graph import Graph
from gremlin_python.process.graph_traversal import __
from gremlin_python.process.strategies import *
from gremlin_python.process.traversal import Cardinality
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection
from gremlin_python.process.traversal import *
import os

NEPTUNE_CLUSTER_RO_URL = os.environ['NEPTUNE_CLUSTER_RO_URL']

logger = logging.getLogger('getRoutesFunction')
logger.setLevel(logging.DEBUG)


def lambda_handler(event, context):
    statics.load_statics(globals())

    graph = Graph()
    remoteConn = DriverRemoteConnection(NEPTUNE_CLUSTER_RO_URL, 'g')

    g = graph.traversal().withRemote(remoteConn)

    # Get all routes out of the requested airport
    logger.debug(
        'Getting all children nodes - aka airports connected to the input airport via a route')
    airportId = str(event['arguments'].get('airportId'))
    resultset = g.V().hasLabel('airport').has('code', airportId).out(
        'route').path().by('code').toList()

    logger.debug(str(resultset))
    return str(resultset)
