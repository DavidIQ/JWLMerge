﻿namespace JWLMerge.Helpers
{
    using System.Collections.Generic;
    using System.Linq;
    using JWLMerge.BackupFileServices.Models.DatabaseModels;
    using JWLMerge.Models;

    internal class PublicationHelper
    {
        public static PublicationDef[] GetPublications(List<Location> locations, List<UserMark> userMarks, bool includeAllPublicationsItem)
        {
            var locationsThatAreMarked = userMarks.Select(x => x.LocationId).ToHashSet();

            var result = locations
                .Where(x => locationsThatAreMarked.Contains(x.LocationId))
                .Select(x => x.KeySymbol).Distinct().Select(
                    x => new PublicationDef
                    {
                        KeySymbol = x,
                    }).OrderBy(x => x.KeySymbol).ToList();

            if (includeAllPublicationsItem)
            {
                result.Insert(0, new PublicationDef
                {
                    IsAllPublicationsSymbol = true,
                    KeySymbol = "All Publications",
                });
            }

            return result.ToArray();
        }
    }
}