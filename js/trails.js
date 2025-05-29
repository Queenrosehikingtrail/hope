const trailsData = [
  {
    id: "ram-pump",
    name: "Ram Pump Trail",
    distance: 1.6,
    type: "one-day",
    kmlFilename: "Ram PumpTrail - 1.6 km.kml",
    description: "For those with a limited level of fitness who would like to spend some time away from it all, the Ram Pump Trail is just for you, or if you are interested in engineering and would like to see how a pump works without electricity nor an internal combustion motor, this trail is a must. The trail takes you through a small grassland and natural bush bordering on a Pine plantation.",
    elevationImage: "Ram Pump Trail Elevation.jpg"
  },
  {
    id: "oukraal",
    name: "Oukraal Trail",
    distance: 12.5,
    type: "one-day",
    kmlFilename: "Oukraal Trail - 12.5 km.kml",
    description: "This trail starts and ends at Queens River Base Camp, it offers a bit of everything, starting off with a pine forests trail that continues all the way to the top of the mountain, through grasslands and a special rock outcrop (our very own Stonehenge), passing a spring where you can fill up with ice cold mountain water. It then descents down the mountain with a zig-zag, this can be tough going down, we suggest wearing tight shoes or two pairs of socks. The trail then joins the Matumi Lane Trail back to camp for the next 6.5 km.",
    elevationImage: "Ou Kraal Trail Elevation.jpg"
  },
  {
    id: "mtb-1",
    name: "MTB Trail 1",
    distance: 29.9,
    type: "one-day",
    kmlFilename: "MTB Trail 1 - 29.9 km.kml",
    description: "Our sign posted MTB trail is the 30 km MTB 1 Trail which starts at Queens Base Camp. The trail takes you on a dirt road, a jeep track and a trail back to Queens Base Camp traversing pine forests, indigenous bush, passing a spectacular cascade waterfall with a total drop off of 300 m over a kilometre. The trail then continues all the way to the top of the mountain with a breathtaking view that will give you a chance to explore the Devils Knuckles, a mountain edge that divides Nelshoogte and the Barberton Basin. It has similar views to Kaapsche Hoop with views over the Barberton valley, a vertical drop of up to 500m on most knuckles. The trail also offers two separate dams for those interested in bass fishing, with an option of passing a beautiful waterfall and a natural pool to cool down in. A short climb will bring you back to the Queens Base Camp where you can enjoy a nice braai before leaving for home or stay over for a night in the tranquil settings of our Queens Base Camp",
    elevationImage: "Mountain Bike Trail Elevations.jpg"
  },
  {
    id: "matumi",
    name: "Matumi Trail",
    distance: 6.2,
    type: "one-day",
    kmlFilename: "Matumi Trail - 6.2 km.kml",
    description: "You need to be dropped off at the starting point at the Matumi Lane Bush Camp. This trail starts in the Queensriver Nature Reserve and follows the Queens River for 6.5 km back to Queens Base Camp. There are several river crossings with wooden bridges, natural pools to cool down in and a spectacular cascade waterfall. This trail has areas that compare to a scene out of a fairy tale movie.",
    elevationImage: "Matumi Lane Trail Elevation.jpg"
  },
  {
    id: "devils-knuckles",
    name: "Devils Knuckles Trail",
    distance: 10.9,
    type: "one-day",
    kmlFilename: "Devils Knuckles Trail - 10.9 km.kml",
    description: "You need to be dropped off at the starting point at the Nelshoogte Forestry Station Houthuis and you will hike the 13 km to the Queens Base Camp. The trail also offers two separate dams for those interested in bass fishing. The trail takes you through Pine plantations and natural bush with an option of passing a beautiful waterfall and a natural pool to cool down.",
    elevationImage: "Devils Knuckles Trail Elevation.jpg"
  },
  {
    id: "cupids-falls",
    name: "Cupids Falls Trail",
    distance: 2.8,
    type: "one-day",
    kmlFilename: "Cupids Falls Trail - 2.8 km.kml",
    description: "This is a short trail starting at Queens River Base Camp to Cupids Waterfall (a stunning cascade waterfall with a total drop off of 300 m over a kilometre) Ample spots to relax and cool down in one of the natural pools. A downhill trail to the falls and uphill back to camp.",
    elevationImage: "Cupids Trail Elevation.jpg"
  },
  {
    id: "2-day-trail-full",
    name: "2 Day Trail (Full)",
    distance: 19.2,
    type: "multi-day",
    kmlFilename: "2 - Day Trail - 19.2 km.kml",
    description: "Complete 2-day overnight trail."
    // No single elevation image provided for full trail
  },
  {
    id: "2-day-trail-day-1",
    name: "2 Day Trail - Day 1",
    distance: 13,
    type: "multi-day-segment",
    kmlFilename: "2 Day Trail, day 1 - 13 km.kml",
    description: "The first day is a 13 km trail through mountain passes, indigenous forests and with many stream crossings (some with wooden bridges), through the Montrose Valley with two options on accommodation, for those seeking the authentic hiker’s experience and looking for something special, the Matumi Lane Bush Camp Cabin is the place to stay. Nestled amongst the picturesque indigenous bush the cabin looks like it has been plucked straight from the pages of a fairy-tale. For weary hikers this is the perfect remedy for tired feet and the great news for those reluctant to walk is that it can be hired out by non-hikers too. For those that enjoy being out in nature the Matumi Bush Camp is a fenced camp in the Queens River Nature Reserve. Situated on the banks of the Queens River which offers a basic camping experience, the brave can cool down in the river pools, a lapa to sit around the fire at night, a flushing toilet and a lot of hot water with a gas heated shower. Tents and mattresses can be rented if needed.",
    elevationImage: "2 day trail - day 1 elevation.jpg"
  },
  {
    id: "2-day-trail-day-2",
    name: "2 Day Trail - Day 2",
    distance: 6.2,
    type: "multi-day-segment",
    kmlFilename: "2 Day Trail, day 2 - 6.2 km.kml",
    description: "The second day is a 6.5 km trail that follows the Matumi Lane Trail back to the Queens Base Camp through the Queens River Nature Reserve and the Nelshoogte Plantation following the Queens River. Along the route you will be treated to a wide variety of indigenous plants and animal species, including the 350 types of birds that are found here. There are several river crossings with wooden bridges, natural pools to cool down in and a spectacular cascade waterfall. This trail has areas that compare to a scene out of a fairy tale movie.",
    elevationImage: "2 day trail - day 2 elevation.jpg"
  },
  {
    id: "3-day-trail-full",
    name: "3 Day Trail (Full)",
    distance: 39.5,
    type: "multi-day",
    kmlFilename: "3 - Day Trail - 39.5 km.kml",
    description: "Complete 3-day backpacking trail."
    // No single elevation image provided for full trail
  },
  {
    id: "3-day-trail-day-1",
    name: "3 Day Trail - Day 1",
    distance: 10.9,
    type: "multi-day-segment",
    kmlFilename: "3 Day Trail, day 1 - 10.9 km.kml",
    description: "This trail starts at the Nelshoogte Forestry Station Houthuis and is perfect for those that don’t want to drive the 7km gravel road to Queens Base Camp. The road to the log cabin is tarred all the way. To stay at the Nelshoogte Forestry Station Houthuis and then hike the 12.7 km to the Queens Base Camp. The trail also offers two separate dams for those interested in bass fishing. The trail takes you through Pine plantations and natural bush with an option of passing a beautiful waterfall and a natural pool to cool down.",
    elevationImage: "3 day trail - day 1 elevation.jpg"
  },
  {
    id: "3-day-trail-day-2",
    name: "3 Day Trail - Day 2",
    distance: 13,
    type: "multi-day-segment",
    kmlFilename: "3 Day Trail, day 2 - 13 km.kml",
    description: "It winds 13 km through mountain passes, indigenous forests and with 23 stream crossings (some with wooden bridges), through the Montrose Valley and the Queens River Nature Reserve. You then have two options on accommodation, for those seeking the authentic hiker’s experience and looking for something special, the Matumi Lane Bush Camp Cabin is the place to stay. Nestled amongst the picturesque indigenous bush the cabin looks like it has been plucked straight from the pages of a fairy-tale. For weary hikers this is the perfect remedy for tired feet and the great news for those reluctant to walk is that it can be hired out by non-hikers too. For those that enjoy being out in nature the Matumi Bush Camp is a fenced camp in the Queensriver Nature Reserve. Situated on the banks of the Queens River which offers a basic camping experience, the brave can cool down in the river pools, a lapa to sit around the fire at night, a flushing toilet and a lot of hot water with a gas heated shower. Tents and mattresses can be rented if needed.",
    elevationImage: "3 day trail - day 2 elevation.jpg"
  },
  {
    id: "3-day-trail-day-3",
    name: "3 Day Trail - Day 3",
    distance: 15.6,
    type: "multi-day-segment",
    kmlFilename: "3 Day Trail, day 3 - 15.6 km.kml",
    description: "Our newest trail to date. This trail will give you a chance to explore Devils Knuckles, a mountain edge that divides Nelshoogte and the Barberton Basin. It has similar views to Kaapsche Hoop with views over the Barberton valley, a vertical drop of up to 500m on most knuckles. The trail passes a dam for those interested in bass fishing just before reaching the end point which is the Nelshoogte Forestry Station Houthuis.",
    elevationImage: "3 day trail - day 3 elevation.jpg"
  },
  {
    id: "4-day-trail-full",
    name: "4 Day Trail (Full)",
    distance: 49,
    type: "multi-day",
    kmlFilename: "4 - Day Trail - 49 km.kml",
    description: "Complete 4-day demanding trek."
    // No single elevation image provided for full trail
  },
  {
    id: "4-day-trail-day-1",
    name: "4 Day Trail - Day 1",
    distance: 15.6,
    type: "multi-day-segment",
    kmlFilename: "4 Day Trail, day 1 - 15.6 km.kml",
    description: "Our newest trail to date. This trail will give you a chance to explore Devils Knuckles, a mountain edge that divides Nelshoogte and the Barberton Basin. It has similar views to Kaapsche Hoop with views over the Barberton valley, a vertical drop of up to 500m on most knuckles. The trail passes a dam for those interested in bass fishing just after beginning the trail. Hike the 15.7 km to reach the end point which is the Matumi Lane Bush Camp.",
    elevationImage: "4 day trail - day 1 elevation.jpg"
  },
  {
    id: "4-day-trail-day-2",
    name: "4 Day Trail - Day 2",
    distance: 6.2,
    type: "multi-day-segment",
    kmlFilename: "4 Day Trail, day 2 - 6.2 km.kml",
    description: "The second day is a 6.5 km trail that follows the Matumi Lane Trail back to the Queens Base Camp through the Queens River Nature Reserve and the Nelshoogte Plantation following the Queens River. Along the route you will be treated to a wide variety of indigenous plants and animal species, including the 350 types of birds that are found here. There are several river crossings with wooden bridges, natural pools to cool down in and a spectacular cascade waterfall. This trail has areas that compare to a scene out of a fairy tale movie.",
    elevationImage: "4 day trail - day 2 elevation.jpg"
  },
  {
    id: "4-day-trail-day-3",
    name: "4 Day Trail - Day 3",
    distance: 13,
    type: "multi-day-segment",
    kmlFilename: "4 Day Trail, day 3 - 13 km.kml",
    description: "It winds 13 km through mountain passes, indigenous forests and with 23 stream crossings (some with wooden bridges), through the Montrose Valley and the Queens River Nature Reserve. You then have two options on accommodation, for those seeking the authentic hiker’s experience and looking for something special, the Matumi Lane Bush Camp Cabin is the place to stay. Nestled amongst the picturesque indigenous bush the cabin looks like it has been plucked straight from the pages of a fairy-tale. For weary hikers this is the perfect remedy for tired feet and the great news for those reluctant to walk is that it can be hired out by non-hikers too. For those that enjoy being out in nature the Matumi Bush Camp is a fenced camp in the Queensriver Nature Reserve. Situated on the banks of the Queens River which offers a basic camping experience, the brave can cool down in the river pools, a lapa to sit around the fire at night, a flushing toilet and a lot of hot water with a gas heated shower. Tents and mattresses can be rented if needed.",
    elevationImage: "4 day trail - day 3 elevation.jpg"
  },
  {
    id: "4-day-trail-day-4",
    name: "4 Day Trail - Day 4",
    distance: 14.2,
    type: "multi-day-segment",
    kmlFilename: "4 Day Trail, day 4- 14.2 km.kml",
    description: "This trail starts at the Matumi Lane Bush Camp. You hike the 14.4 km up to the Nelshoogte Forestry Station Houthuis. This trail takes you along the dirt road for a section of the way. It goes through Pine plantations and natural bush with an option of passing a beautiful waterfall and a natural pool to cool down. The trail also offers two separate dams for those interested in bass fishing before reaching the Nelshoogte Forestry Station Houthuis end point.",
    elevationImage: "4 day trail - day 4 elevation.jpg"
  },
  {
    id: "5-day-trail-full",
    name: "5 Day Trail (Full)",
    distance: 53.5,
    type: "multi-day",
    kmlFilename: "5 - Day Trail - 53.5 km.kml",
    description: "Complete 5-day extensive journey."
    // No single elevation image provided for full trail
  },
  {
    id: "5-day-trail-day-1",
    name: "5 Day Trail - Day 1",
    distance: 10.9,
    type: "multi-day-segment",
    kmlFilename: "5 Day Trail, day 1 - 10.9 km.kml",
    description: "This trail starts at the Nelshoogte Forestry Station Houthuis and is perfect for those that don’t want to drive the 7km gravel road to Queens Base Camp. The road to the log cabin is tarred all the way. To stay at the Nelshoogte Forestry Station Houthuis and then hike the 12.7 km to the Queens Base Camp. The trail also offers two separate dams for those interested in bass fishing. The trail takes you through Pine plantations and natural bush with an option of passing a beautiful waterfall and a natural pool to cool down.",
    elevationImage: "5 day trail - day 1 elevation.jpg"
  },
  {
    id: "5-day-trail-day-2",
    name: "5 Day Trail - Day 2",
    distance: 12.5,
    type: "multi-day-segment",
    kmlFilename: "5 Day Trail, day 2 - 12.5 km.kml",
    description: "This 13 km trail starts and ends at Queens River Base Camp, it offers a bit of everything, starting off with a pine forests trail that continues all the way to the top of the mountain, through grasslands and a special rock outcrop (our very own Stonehenge), passing a spring where you can fill up with ice cold mountain water. It then descents down the mountain with a zig-zag, this can be tough going down, we suggest wearing tight shoes or two pairs of socks. Hiking to the Matumi Lane Bush Camp and then following the Matumi Lane Trail for the second leg of 6.5 km that brings you back to the Queens Base Camp through the Queens River Nature Reserve and the Nelshoogte Plantation following the Queens River. Along the route you will be treated to a wide variety of indigenous plants and animal species, including the 350 types of birds that are found here. There are several river crossings with wooden bridges, natural pools to cool down in and a spectacular cascade waterfall. This trail has areas that compare to a scene out of a fairy tale movie.",
    elevationImage: "5 day trail - day 2 elevation.jpg"
  },
  {
    id: "5-day-trail-day-3",
    name: "5 Day Trail - Day 3",
    distance: 13,
    type: "multi-day-segment",
    kmlFilename: "5 Day Trail, day 3 - 13 km.kml",
    description: "It winds 13 km through mountain passes, indigenous forests and with 23 stream crossings (some with wooden bridges), through the Montrose Valley and the Queens River Nature Reserve. You then have two options on accommodation, for those seeking the authentic hiker’s experience and looking for something special, the Matumi Lane Bush Camp Cabin is the place to stay. Nestled amongst the picturesque indigenous bush the cabin looks like it has been plucked straight from the pages of a fairy-tale. For weary hikers this is the perfect remedy for tired feet and the great news for those reluctant to walk is that it can be hired out by non-hikers too. For those that enjoy being out in nature the Matumi Bush Camp is a fenced camp in the Queensriver Nature Reserve. Situated on the banks of the Queens River which offers a basic camping experience, the brave can cool down in the river pools, a lapa to sit around the fire at night, a flushing toilet and a lot of hot water with a gas heated shower. Tents and mattresses can be rented if needed.",
    elevationImage: "5 day trail - day 3 elevation.jpg"
  },
  {
    id: "5-day-trail-day-4",
    name: "5 Day Trail - Day 4",
    distance: 6.2,
    type: "multi-day-segment",
    kmlFilename: "5 Day Trail, day 4 - 6.2 km.kml",
    description: "The fourth day is a 6.5 km trail that follows the Matumi Lane Trail back to the Queens Base Camp through the Queens River Nature Reserve and the Nelshoogte Plantation following the Queens River. Along the route you will be treated to a wide variety of indigenous plants and animal species, including the 350 types of birds that are found here. There are several river crossings with wooden bridges, natural pools to cool down in and a spectacular cascade waterfall. This trail has areas that compare to a scene out of a fairy tale movie",
    elevationImage: "5 day trail - day 4 elevation.jpg"
  },
  {
    id: "5-day-trail-day-5",
    name: "5 Day Trail - Day 5",
    distance: 10.9,
    type: "multi-day-segment",
    kmlFilename: "5 Day Trail, day 5 - 10.9 km.kml",
    description: "This trail starts at the Matumi Lane Bush Camp. You hike the 14.4 km up to the Nelshoogte Forestry Station Houthuis. This trail takes you along the dirt road for a section of the way. It goes through Pine plantations and natural bush with an option of passing a beautiful waterfall and a natural pool to cool down. The trail also offers two separate dams for those interested in bass fishing before reaching the Nelshoogte Forestry Station Houthuis end point.",
    elevationImage: "5 day trail - day 5 elevation.jpg"
  },
  {
    id: "6-day-trail-full",
    name: "6 Day Trail (Full)",
    distance: 64.7,
    type: "multi-day",
    kmlFilename: "6 - Day Trail - 64.7 km.kml",
    description: "Complete 6-day ultimate expedition."
    // No single elevation image provided for full trail
  },
  {
    id: "6-day-trail-day-1",
    name: "6 Day Trail - Day 1",
    distance: 10.9,
    type: "multi-day-segment",
    kmlFilename: "6 Day Trail, day 1 - 10.9 km.kml",
    description: "This trail starts at the Nelshoogte Forestry Station Houthuis and is perfect for those that don’t want to drive the 7km gravel road to Queens Base Camp. The road to the log cabin is tarred all the way. To stay at the Nelshoogte Forestry Station Houthuis and then hike the 12.7 km to the Queens Base Camp. The trail also offers two separate dams for those interested in bass fishing. The trail takes you through Pine plantations and natural bush with an option of passing a beautiful waterfall and a natural pool to cool down.",
    elevationImage: "6 day trail - day 1 elevation.jpg"
  },
  {
    id: "6-day-trail-day-2",
    name: "6 Day Trail - Day 2",
    distance: 12.5,
    type: "multi-day-segment",
    kmlFilename: "6 Day Trail, day 2 - 12.5 km.kml",
    description: "This 13 km trail starts and ends at Queens River Base Camp, it offers a bit of everything, starting off with a pine forests trail that continues all the way to the top of the mountain, through grasslands and a special rock outcrop (our very own Stonehenge), passing a spring where you can fill up with ice cold mountain water. It then descents down the mountain with a zig-zag, this can be tough going down, we suggest wearing tight shoes or two pairs of socks. Hiking to the Matumi Lane Bush Camp and then following the Matumi Lane Trail for the second leg of 6.5 km that brings you back to the Queens Base Camp through the Queens River Nature Reserve and the Nelshoogte Plantation following the Queens River. Along the route you will be treated to a wide variety of indigenous plants and animal species, including the 350 types of birds that are found here. There are several river crossings with wooden bridges, natural pools to cool down in and a spectacular cascade waterfall. This trail has areas that compare to a scene out of a fairy tale movie.",
    elevationImage: "6 day trail - day 2 elevation.jpg"
  },
  {
    id: "6-day-trail-day-3",
    name: "6 Day Trail - Day 3",
    distance: 13,
    type: "multi-day-segment",
    kmlFilename: "6 Day Trail, day 3 - 13 km.kml",
    description: "It winds 13 km through mountain passes, indigenous forests and with 23 stream crossings (some with wooden bridges), through the Montrose Valley and the Queens River Nature Reserve. You then have two options on accommodation, for those seeking the authentic hiker’s experience and looking for something special, the Matumi Lane Bush Camp Cabin is the place to stay. Nestled amongst the picturesque indigenous bush the cabin looks like it has been plucked straight from the pages of a fairy-tale. For weary hikers this is the perfect remedy for tired feet and the great news for those reluctant to walk is that it can be hired out by non-hikers too. For those that enjoy being out in nature the Matumi Bush Camp is a fenced camp in the Queensriver Nature Reserve. Situated on the banks of the Queens River which offers a basic camping experience, the brave can cool down in the river pools, a lapa to sit around the fire at night, a flushing toilet and a lot of hot water with a gas heated shower. Tents and mattresses can be rented if needed.",
    elevationImage: "6 day trail - day 3 elevation.jpg"
  },
  {
    id: "6-day-trail-day-4",
    name: "6 Day Trail - Day 4",
    distance: 6.2,
    type: "multi-day-segment",
    kmlFilename: "6 Day Trail, day 4 - 6.2 km.kml",
    description: "The fourth day is a 6.5 km trail that follows the Matumi Lane Trail back to the Queens Base Camp through the Queens River Nature Reserve and the Nelshoogte Plantation following the Queens River. Along the route you will be treated to a wide variety of indigenous plants and animal species, including the 350 types of birds that are found here. There are several river crossings with wooden bridges, natural pools to cool down in and a spectacular cascade waterfall. This trail has areas that compare to a scene out of a fairy tale movie.",
    elevationImage: "6 day trail - day 4 elevation.jpg"
  },
  {
    id: "6-day-trail-day-5",
    name: "6 Day Trail - Day 5",
    distance: 6.5,
    type: "multi-day-segment",
    kmlFilename: "6 Day Trail, day 5 - 6.5 km.kml",
    description: "The fifth day takes you from Queens Base Camp hiking 6.5 km to the Matumi Lane Bush Camp. The trail follows a section of our MTB 1 trail on the dirt road. The trail goes through the Nelshoogte Plantation and the Queens River Nature Reserve. Along the route you will be treated to a wide variety of indigenous plants and animal species, including the 350 types of birds that are found here.",
    elevationImage: "6 day trail - day 5 elevation.jpg"
  },
  {
    id: "6-day-trail-day-6",
    name: "6 Day Trail - Day 6",
    distance: 15.6,
    type: "multi-day-segment",
    kmlFilename: "6 Day Trail, day 6 - 15.6 km.kml",
    description: "Our newest trail to date. This trail will give you a chance to explore Devils Knuckles, a mountain edge that divides Nelshoogte and the Barberton Basin. It has similar views to Kaapsche Hoop with views over the Barberton valley, a vertical drop of up to 500m on most knuckles. The trail passes a dam for those interested in bass fishing just before reaching the end point which is the Nelshoogte Forestry Station Houthuis.",
    elevationImage: "6 day trail - day 6 elevation.jpg"
  }
];

// Function to get trail data by ID
function getTrailById(id) {
  return trailsData.find(trail => trail.id === id);
}

// Function to get all trails
function getAllTrails() {
  return trailsData;
}

