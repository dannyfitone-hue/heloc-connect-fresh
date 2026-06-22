RentCast Current Market Value Fix

Updated app/api/property-value/route.ts to prefer RentCast priceRangeHigh when available and realistic, instead of the conservative base AVM value. This should better match current retail market value ranges used by Zillow-style estimates.

Also increased compCount from 5 to 15 for stronger comparison data.

Environment variable required:
RENTCAST_API_KEY
