/*!
 *  Copyright (c) 2024, Rahul Gupta and Express Accept Events contributors.
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  SPDX-License-Identifier: MPL-2.0
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import acceptEvents from "./index.js";
import { parseList, Token } from "structured-headers";
import { item } from "structured-field-utils";

vi.mock("structured-headers");
vi.mock("structured-field-utils");

describe("Accept Events Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: "",
      headers: {},
    };
    res = {
      setHeader: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should not act if the method is not GET or POST", () => {
    req.method = "PUT";

    acceptEvents(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req).not.toHaveProperty("acceptEvents");
  });

  it("should set an empty Accept-Events response header for GET and POST requests", () => {
    req.method = "GET";

    acceptEvents(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Accept-Events", "");
    expect(next).toHaveBeenCalled();
  });

  it("should skip processing if no `Accept-Events` header is present", () => {
    req.method = "GET";

    acceptEvents(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req).not.toHaveProperty("acceptEvents");
  });

  it("should skip processing if `Accept-Events` header fails to parse", () => {
    req.method = "POST";
    req.headers["accept-events"] = "invalid-header";
    parseList.mockImplementation(() => {
      throw new Error("Parse Error");
    });

    acceptEvents(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req).not.toHaveProperty("acceptEvents");
  });

  it("should proceed if valid accept-events header is present and correctly parsed", () => {
    req.method = "GET";
    req.headers["accept-events"] = '"prep"; q=0.8"';
    parseList.mockReturnValue([
      [
        "prep",
        new Map([
          ["q", 0.8], //
        ]),
      ],
    ]);
    item.sort.mockReturnValue([
      [
        "prep",
        new Map([
          ["q", 0.8], //
        ]),
      ],
    ]);
    acceptEvents(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.acceptEvents).toHaveLength(1);
    expect(req.acceptEvents[0][0]).toBe("prep");
    expect(req.acceptEvents[0][1].get("q")).toBe(0.8);
  });

  it("should skip if every item is filtered out", () => {
    req.method = "GET";
    req.headers["accept-events"] = "200";
    parseList.mockReturnValue([
      [200], //
    ]);
    acceptEvents(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req).not.toHaveProperty("acceptEvents");
  });

  it("should properly filter entries that are not string like", () => {
    req.method = "GET";
    req.headers["accept-events"] = '200, high, "low"; q=0.9';
    const mockTokenHigh = new Token("high");
    mockTokenHigh.toString.mockReturnValue("high");
    parseList.mockReturnValue([
      [200, new Map()],
      [mockTokenHigh, new Map()],
      [
        "low",
        new Map([
          ["q", 0.9], //
        ]),
      ],
    ]);
    item.sort.mockImplementation((items) => items);
    acceptEvents(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.acceptEvents).toHaveLength(2);
    expect(req.acceptEvents[0][0]).toBe("high");
    expect(req.acceptEvents[1][0]).toBe("low");
  });

  it("should properly sort multiple entries based on quality parameter", () => {
    req.method = "GET";
    req.headers["accept-events"] = '"low"; q=0.5, "high"; q=0.9';
    parseList.mockReturnValue([
      [
        "low",
        new Map([
          ["q", 0.5], //
        ]),
      ],
      [
        "high",
        new Map([
          ["q", 0.9], //
        ]),
      ],
    ]);
    item.sort.mockImplementation((items) => {
      return items.sort(
        (a, b) => (b[1]?.get("q") || 1) - (a[1]?.get("q") || 1),
      );
    });
    acceptEvents(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.acceptEvents).toHaveLength(2);
    expect(req.acceptEvents[0][0]).toBe("high");
    expect(req.acceptEvents[1][0]).toBe("low");
  });
});
