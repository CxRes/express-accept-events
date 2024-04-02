/*!
 *  Copyright (c) 2024, Rahul Gupta
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  SPDX-License-Identifier: MPL-2.0
 */
import { useTry } from "no-try";
import { parseList, Token } from "structured-headers";
import { item } from "structured-field-utils";

import Debug from "debug";
const debug = Debug("accept-events");


/**
 *  A middleware function that parses the `Accept-Events` header. It adds an
 *  `acceptEvent` property to the request object.
 */
function acceptEventsMiddleware(req, res, next) {
  // We process `Accept-Events` only for GET requests
  if (req.method === "GET" || req.method === "POST") {
    // Accept Events response header is set for HEAD or GET responses
    // To be appended by protocol specific middlewares
    res.setHeader("Accept-Events", "");

    // Check if Accept-Events header exists in request
    const acceptEventsRawH = req.headers["accept-events"];
    // If no accept-events header exists, Skip!
    if (!acceptEventsRawH) {
      debug("No Accept-Error header specified");
      return next && next();
    }

    // Check if Accept-Events header parses
    const [acceptEventsParseError, acceptEventsH] = useTry(() =>
      parseList(acceptEventsRawH),
    );
    // If the accept-events header fails to parse as a List, Skip!
    if (acceptEventsParseError) {
      debug(acceptEventsParseError.message);
      return next && next();
    }

    // Rationalize protocols as strings or remove
    const acceptEvents = acceptEventsH.filter((li) => {
      let protocol;
      if (typeof li[0] === "string") protocol = li[0];
      if (li[0] instanceof Token) protocol = li[0].toString();
      return [protocol, li[1]];
    });
    if (acceptEvents.length === 0) {
      debug("No Protocols specified in the Accept Events Header");
      return next && next();
    }

    // Reorder by `q` and parameter count
    req.acceptEvents = item.sort(acceptEvents);
  }

  return next && next();
};

export default acceptEventsMiddleware;
