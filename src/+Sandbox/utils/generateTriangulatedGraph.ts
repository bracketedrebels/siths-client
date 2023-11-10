/** @format */

import { random } from "lodash"
import * as voronoi from "voronoi"

const defaultPointsGap = 100
export default function (pointsAmount = 10000, maxX = Math.sqrt(pointsAmount) * defaultPointsGap, maxY = maxX) {
  const sites = new Array(pointsAmount).fill([maxX, maxY]).map(([mx, my]) => ({
    x: random(0, mx, false),
    y: random(0, my, false),
  }))
  return compute(sites, { xl: 0, xr: maxX, yt: 0, yb: maxY })
}

const distance = (a: { x: number; y: number }, b: typeof a) => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

const cellArea = ({ halfedges = [] as any[] }) => {
  var area = 0
  var iHalfedge = halfedges.length
  var halfedge
  var p1
  var p2
  while (iHalfedge--) {
    halfedge = halfedges[iHalfedge]
    p1 = halfedge.getStartpoint()
    p2 = halfedge.getEndpoint()
    area += p1.x * p2.y
    area -= p1.y * p2.x
  }
  area /= 2
  return area
}

const cellCentroid = ({ halfedges = [] as any[] }) => {
  var x = 0
  var y = 0
  var iHalfedge = halfedges.length
  var halfedge
  var v
  var p1
  var p2
  while (iHalfedge--) {
    halfedge = halfedges[iHalfedge]
    p1 = halfedge.getStartpoint()
    p2 = halfedge.getEndpoint()
    v = p1.x * p2.y - p2.x * p1.y
    x += (p1.x + p2.x) * v
    y += (p1.y + p2.y) * v
  }
  v = cellArea({ halfedges }) * 6
  return { x: x / v, y: y / v }
}

function compute(startSites: { x: number; y: number }[], bbox: { xl: number; xr: number; yt: number; yb: number }) {
  const voron = new voronoi()
  function recompute(
    startSites: { x: number; y: number }[],
    bbox: { xl: number; xr: number; yt: number; yb: number },
    resolution: (diagram: any) => void
  ) {
    const diagram = voron.compute(startSites, bbox)
    var cells = diagram.cells.slice()
    var cellIndex = cells.length
    var cell = undefined
    var site = undefined
    var sites = [] as typeof startSites
    var again = false
    var rn = undefined
    var dist = undefined
    var p = (1 / cellIndex) * 0.1
    while (cellIndex--) {
      cell = cells[cellIndex]
      rn = Math.random()
      // probability of apoptosis
      if (rn < p) continue
      site = cellCentroid(cell)
      dist = distance(site, cell.site)
      again = again || dist > 1
      // don't relax too fast
      if (dist > 2) {
        site.x = (site.x + cell.site.x) / 2
        site.y = (site.y + cell.site.y) / 2
      }
      // probability of mytosis
      if (rn > 1 - p) {
        dist /= 2
        sites.push({
          x: site.x + (site.x - cell.site.x) / dist,
          y: site.y + (site.y - cell.site.y) / dist,
        })
      }
      sites.push(site)
    }
    if (again) setImmediate(() => recompute(sites, bbox, resolution))
    else resolution(diagram)
  }
  return new Promise(resolve => recompute(startSites, bbox, resolve))
}
