-- Find cafes ordered by straight-line distance from the selected neighborhood center.
-- The neighborhood value is supplied by the app as the @neighborhood parameter.
SELECT
    cafe.cafe_id AS cafeId,
    cafe.cafe_name AS name,
    cafe_neighborhood.neighborhood_name AS neighborhood,
    cafe.street_address AS address,
    cafe.website_url AS websiteUrl,
    cafe.source_url AS sourceUrl,
    CAST(ROUND(
        2 * 3958.8 * ASIN(SQRT(
            POWER(SIN(RADIANS(CONVERT(FLOAT, cafe.latitude)
                - CONVERT(FLOAT, origin.center_lat)) / 2.0), 2)
            + COS(RADIANS(CONVERT(FLOAT, origin.center_lat)))
            * COS(RADIANS(CONVERT(FLOAT, cafe.latitude)))
            * POWER(SIN(RADIANS(CONVERT(FLOAT, cafe.longitude)
                - CONVERT(FLOAT, origin.center_lon)) / 2.0), 2)
        )),
        1
    ) AS DECIMAL(6,1)) AS distanceMiles,
    profile.menu_summary AS menuSummary,
    profile.vibe_description AS vibeDescription,
    profile.seating_description AS seatingDescription,
    profile.outlet_rating AS outletRating,
    profile.restroom_available AS restroomAvailable,
    profile.is_estimate AS profileIsEstimate,
    COALESCE(JSON_QUERY((
        SELECT
            crowd.day_of_week AS dayOfWeek,
            crowd.time_period AS timePeriod,
            crowd.busy_percent AS busyPercent,
            crowd.is_estimate AS isEstimate
        FROM dbo.CafeCrowdLevel AS crowd
        WHERE crowd.cafe_id = cafe.cafe_id
        ORDER BY crowd.day_of_week, crowd.time_period
        FOR JSON PATH
    )), N'[]') AS crowd_json,
    COALESCE(JSON_QUERY((
        SELECT
            transit.mode AS mode,
            transit.route_description AS description,
            transit.travel_minutes AS travelMinutes,
            transit.is_estimate AS isEstimate
        FROM dbo.CafeTransit AS transit
        WHERE transit.cafe_id = cafe.cafe_id
            AND transit.origin_neighborhood_id = origin.neighborhood_id
        ORDER BY transit.mode, transit.route_description
        FOR JSON PATH
    )), N'[]') AS transit_json
FROM dbo.Cafe AS cafe
JOIN dbo.Neighborhood AS cafe_neighborhood
    ON cafe_neighborhood.neighborhood_id = cafe.neighborhood_id
CROSS JOIN dbo.Neighborhood AS origin
LEFT JOIN dbo.CafeStudyProfile AS profile
    ON profile.cafe_id = cafe.cafe_id
WHERE origin.neighborhood_name = @neighborhood
ORDER BY distanceMiles, cafe.cafe_name;
