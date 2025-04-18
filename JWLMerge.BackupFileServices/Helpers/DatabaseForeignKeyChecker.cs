﻿using JWLMerge.BackupFileServices.Exceptions;
using JWLMerge.BackupFileServices.Models.DatabaseModels;

namespace JWLMerge.BackupFileServices.Helpers;

internal static class DatabaseForeignKeyChecker
{
    public static void Execute(Database database)
    {
        CheckBlockRangeValidity(database);
        CheckBookmarkValidity(database);
        CheckInputFieldValidity(database);
        CheckNoteValidity(database);
        CheckTagMapValidity(database);
        CheckUserMarkValidity(database);
        CheckIndependentMediaValidity(database);
        CheckPlaylistItemValidity(database);
        CheckPlaylistItemIndependentMediaMapValidity(database);
        CheckPlaylistItemLocationMapValidity(database);
        CheckPlaylistItemMarkerValidity(database);
        CheckPlaylistItemMarkerParagraphMapValidity(database);
        CheckPlaylistItemMarkerBibleVerseMapValidity(database);
    }

    private static void CheckBlockRangeValidity(Database database)
    {
        foreach (var range in database.BlockRanges)
        {
            if (database.FindUserMark(range.UserMarkId) == null)
            {
                throw new BackupFileServicesException($"Could not find user mark Id for block range {range.BlockRangeId}");
            }
        }
    }

    private static void CheckBookmarkValidity(Database database)
    {
        foreach (var bookmark in database.Bookmarks)
        {
            if (database.FindLocation(bookmark.LocationId) == null ||
                database.FindLocation(bookmark.PublicationLocationId) == null)
            {
                throw new BackupFileServicesException($"Could not find location for bookmark {bookmark.BookmarkId}");
            }
        }
    }

    private static void CheckInputFieldValidity(Database database)
    {
        foreach (var inputField in database.InputFields)
        {
            if (database.FindLocation(inputField.LocationId) == null)
            {
                throw new BackupFileServicesException($"Could not find a location for input field {inputField.Value}");
            }
        }
    }

    private static void CheckNoteValidity(Database database)
    {
        foreach (var note in database.Notes)
        {
            if (note.UserMarkId != null && database.FindUserMark(note.UserMarkId.Value) == null)
            {
                throw new BackupFileServicesException($"Could not find user mark Id for note {note.NoteId}");
            }

            if (note.LocationId != null && database.FindLocation(note.LocationId.Value) == null)
            {
                throw new BackupFileServicesException($"Could not find location for note {note.NoteId}");
            }
        }
    }

    private static void CheckTagMapValidity(Database database)
    {
        foreach (var tagMap in database.TagMaps)
        {
            if (database.FindTag(tagMap.TagId) == null)
            {
                throw new BackupFileServicesException($"Could not find tag for tag map {tagMap.TagMapId}");
            }

            if (tagMap.NoteId != null && database.FindNote(tagMap.NoteId.Value) == null)
            {
                throw new BackupFileServicesException($"Could not find note for tag map {tagMap.TagMapId}");
            }

            if (tagMap.LocationId != null && database.FindLocation(tagMap.LocationId.Value) == null)
            {
                throw new BackupFileServicesException($"Could not find location for tag map {tagMap.TagMapId}");
            }

            if (tagMap.PlaylistItemId != null && database.FindPlaylistItem(tagMap.PlaylistItemId.Value) == null)
            {
                throw new BackupFileServicesException($"Could not find playlist item for tag map {tagMap.TagMapId}");
            }
        }
    }

    private static void CheckUserMarkValidity(Database database)
    {
        foreach (var userMark in database.UserMarks)
        {
            if (database.FindLocation(userMark.LocationId) == null)
            {
                throw new BackupFileServicesException($"Could not find location for user mark {userMark.UserMarkId}");
            }
        }
    }

    private static void CheckIndependentMediaValidity(Database database)
    {
        foreach (var independentMedia in database.IndependentMedias)
        {
            if (database.FindIndependentMedia(independentMedia.IndependentMediaId) == null)
            {
                throw new BackupFileServicesException($"Could not find independent media {independentMedia.IndependentMediaId}");
            }
        }
    }

    private static void CheckPlaylistItemValidity(Database database)
    {
        foreach (var playlistItem in database.PlaylistItems)
        {
            if (database.FindPlaylistItem(playlistItem.PlaylistItemId) == null)
            {
                throw new BackupFileServicesException($"Could not find playlist item {playlistItem.PlaylistItemId}");
            }

            if (!string.IsNullOrWhiteSpace(playlistItem.ThumbnailFilePath) && database.FindIndependentMedia(playlistItem.ThumbnailFilePath) == null)
            {
                throw new BackupFileServicesException($"Could not find independent media for playlist item {playlistItem.PlaylistItemId}");
            }
        }
    }

    private static void CheckPlaylistItemIndependentMediaMapValidity(Database database)
    {
        foreach (var playlistItemIndependentMediaMap in database.PlaylistItemIndependentMediaMaps)
        {
            if (database.FindPlaylistItem(playlistItemIndependentMediaMap.PlaylistItemId) == null)
            {
                throw new BackupFileServicesException($"Could not find playlist item map for independent media {playlistItemIndependentMediaMap.IndependentMediaId}");
            }

            if (database.FindIndependentMedia(playlistItemIndependentMediaMap.IndependentMediaId) == null)
            {
                throw new BackupFileServicesException($"Could not find independent media for playlist item map {playlistItemIndependentMediaMap.PlaylistItemId}");
            }
        }
    }

    private static void CheckPlaylistItemLocationMapValidity(Database database)
    {
        foreach (var playlistItemLocationMap in database.PlaylistItemLocationMaps)
        {
            if (database.FindPlaylistItem(playlistItemLocationMap.PlaylistItemId) == null)
            {
                throw new BackupFileServicesException($"Could not find playlist item for location {playlistItemLocationMap.LocationId}");
            }

            if (database.FindLocation(playlistItemLocationMap.LocationId) == null)
            {
                throw new BackupFileServicesException($"Could not find location for playlist item {playlistItemLocationMap.PlaylistItemId}");
            }
        }
    }

    private static void CheckPlaylistItemMarkerValidity(Database database)
    {
        foreach (var playlistItemMarker in database.PlaylistItemMarkers)
        {
            if (database.FindPlaylistItem(playlistItemMarker.PlaylistItemId) == null)
            {
                throw new BackupFileServicesException($"Could not find playlist item for marker {playlistItemMarker.PlaylistItemMarkerId}");
            }
        }
    }

    private static void CheckPlaylistItemMarkerParagraphMapValidity(Database database)
    {
        foreach (var playlistItemMarkerParagraphMap in database.PlaylistItemMarkerParagraphMaps)
        {
            if (database.FindPlaylistItemMarker(playlistItemMarkerParagraphMap.PlaylistItemMarkerId) == null)
            {
                throw new BackupFileServicesException($"Could not find playlist item marker for paragraph map {playlistItemMarkerParagraphMap.PlaylistItemMarkerId}");
            }
        }
    }

    private static void CheckPlaylistItemMarkerBibleVerseMapValidity(Database database)
    {
        foreach (var playlistItemMarkerBibleVerseMap in database.PlaylistItemMarkerBibleVerseMaps)
        {
            if (database.FindPlaylistItemMarker(playlistItemMarkerBibleVerseMap.PlaylistItemMarkerId) == null)
            {
                throw new BackupFileServicesException($"Could not find playlist item marker for bible verse map {playlistItemMarkerBibleVerseMap.PlaylistItemMarkerId}");
            }
        }
    }
}