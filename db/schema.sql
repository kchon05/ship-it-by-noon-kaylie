IF OBJECT_ID(N'dbo.Neighborhood', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Neighborhood (
        neighborhood_id INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Neighborhood PRIMARY KEY,
        neighborhood_name NVARCHAR(80) NOT NULL
            CONSTRAINT UQ_Neighborhood_Name UNIQUE,
        center_lat DECIMAL(9,6) NOT NULL,
        center_lon DECIMAL(9,6) NOT NULL,
        CONSTRAINT CK_Neighborhood_Latitude CHECK (center_lat BETWEEN -90 AND 90),
        CONSTRAINT CK_Neighborhood_Longitude CHECK (center_lon BETWEEN -180 AND 180)
    );
END;

IF OBJECT_ID(N'dbo.Cafe', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cafe (
        cafe_id INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Cafe PRIMARY KEY,
        neighborhood_id INT NOT NULL,
        osm_ref NVARCHAR(80) NOT NULL
            CONSTRAINT UQ_Cafe_OSMRef UNIQUE,
        cafe_name NVARCHAR(160) NOT NULL,
        street_address NVARCHAR(240) NULL,
        latitude DECIMAL(9,6) NOT NULL,
        longitude DECIMAL(9,6) NOT NULL,
        website_url NVARCHAR(500) NULL,
        source_url NVARCHAR(500) NOT NULL,
        CONSTRAINT FK_Cafe_Neighborhood FOREIGN KEY (neighborhood_id)
            REFERENCES dbo.Neighborhood (neighborhood_id),
        CONSTRAINT CK_Cafe_Latitude CHECK (latitude BETWEEN -90 AND 90),
        CONSTRAINT CK_Cafe_Longitude CHECK (longitude BETWEEN -180 AND 180)
    );
    CREATE INDEX IX_Cafe_Neighborhood ON dbo.Cafe (neighborhood_id);
END;

IF OBJECT_ID(N'dbo.CafeStudyProfile', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CafeStudyProfile (
        cafe_id INT NOT NULL
            CONSTRAINT PK_CafeStudyProfile PRIMARY KEY,
        menu_summary NVARCHAR(300) NULL,
        vibe_description NVARCHAR(300) NULL,
        seating_description NVARCHAR(300) NULL,
        outlet_rating TINYINT NULL,
        restroom_available BIT NULL,
        is_estimate BIT NOT NULL
            CONSTRAINT DF_CafeStudyProfile_IsEstimate DEFAULT (0),
        source_note NVARCHAR(300) NULL,
        CONSTRAINT FK_CafeStudyProfile_Cafe FOREIGN KEY (cafe_id)
            REFERENCES dbo.Cafe (cafe_id),
        CONSTRAINT CK_CafeStudyProfile_OutletRating
            CHECK (outlet_rating IS NULL OR outlet_rating BETWEEN 1 AND 5)
    );
END;

IF OBJECT_ID(N'dbo.CafeCrowdLevel', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CafeCrowdLevel (
        cafe_id INT NOT NULL,
        day_of_week TINYINT NOT NULL,
        time_period NVARCHAR(20) NOT NULL,
        busy_percent TINYINT NOT NULL,
        is_estimate BIT NOT NULL
            CONSTRAINT DF_CafeCrowdLevel_IsEstimate DEFAULT (0),
        source_note NVARCHAR(300) NULL,
        CONSTRAINT PK_CafeCrowdLevel PRIMARY KEY (cafe_id, day_of_week, time_period),
        CONSTRAINT FK_CafeCrowdLevel_Cafe FOREIGN KEY (cafe_id)
            REFERENCES dbo.Cafe (cafe_id),
        CONSTRAINT CK_CafeCrowdLevel_DayOfWeek CHECK (day_of_week BETWEEN 1 AND 7),
        CONSTRAINT CK_CafeCrowdLevel_TimePeriod
            CHECK (time_period IN (N'Morning', N'Midday', N'Afternoon', N'Evening')),
        CONSTRAINT CK_CafeCrowdLevel_Percent CHECK (busy_percent BETWEEN 0 AND 100)
    );
END;

IF OBJECT_ID(N'dbo.CafeTransit', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CafeTransit (
        transit_id INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_CafeTransit PRIMARY KEY,
        cafe_id INT NOT NULL,
        origin_neighborhood_id INT NOT NULL,
        mode NVARCHAR(40) NOT NULL,
        route_description NVARCHAR(240) NOT NULL,
        travel_minutes SMALLINT NULL,
        is_estimate BIT NOT NULL
            CONSTRAINT DF_CafeTransit_IsEstimate DEFAULT (0),
        source_note NVARCHAR(300) NULL,
        CONSTRAINT FK_CafeTransit_Cafe FOREIGN KEY (cafe_id)
            REFERENCES dbo.Cafe (cafe_id),
        CONSTRAINT FK_CafeTransit_OriginNeighborhood FOREIGN KEY (origin_neighborhood_id)
            REFERENCES dbo.Neighborhood (neighborhood_id),
        CONSTRAINT CK_CafeTransit_TravelMinutes
            CHECK (travel_minutes IS NULL OR travel_minutes > 0),
        CONSTRAINT UQ_CafeTransit_Route
            UNIQUE (cafe_id, origin_neighborhood_id, mode, route_description)
    );
END;
