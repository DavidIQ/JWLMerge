﻿using System.Globalization;
using CommunityToolkit.Mvvm.ComponentModel;
using System.Collections;
using System.Collections.Generic;
using JWLMerge.BackupFileServices.Models;
using JWLMerge.BackupFileServices.Models.DatabaseModels;
using JWLMerge.BackupFileServices.Models.ManifestFile;
using JWLMerge.Models;

namespace JWLMerge.ViewModel;

internal sealed class DetailViewModel : ObservableObject
{
    private DataTypeListItem? _selectedDataType;
    private bool _notesRedacted;
    private string? _windowTitle;
    private BackupFile? _backupFile;
        
    public DetailViewModel() 
    {
        ListItems = CreateListItems();
    }

    public string? FilePath { get; set; }

    public BackupFile? BackupFile
    {
        get => _backupFile;
        set
        {
            if (_backupFile != value)
            {
                SetProperty(ref _backupFile, value);
                var deviceName = BackupFile?.Manifest.UserDataBackup.DeviceName;
                WindowTitle = $"Details - {deviceName}";
            }
        }
    }

    public List<DataTypeListItem> ListItems { get; }

    public string WindowTitle
    {
        get => _windowTitle ?? string.Empty;
        private set => SetProperty(ref _windowTitle, value);
    }

    public bool NotesRedacted
    {
        get => _notesRedacted;
        set
        {
            if (_notesRedacted != value)
            {
                _notesRedacted = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(NotesNotRedacted));
            }
        }
    }

    public bool NotesNotRedacted => !NotesRedacted;

    public DataTypeListItem? SelectedDataType
    {
        get => _selectedDataType;
        set
        {
            if (_selectedDataType != value)
            {
                _selectedDataType = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(DataItemsSource));
                OnPropertyChanged(nameof(IsNotesItemSelected));
            }
        }
    }

    public IEnumerable? DataItemsSource
    {
        get
        {
            if (SelectedDataType != null)
            {
                switch (SelectedDataType.DataType)
                {
                    case JwLibraryFileDataTypes.BlockRange:
                        return BackupFile?.Database.BlockRanges;

                    case JwLibraryFileDataTypes.Location:
                        return BackupFile?.Database.Locations;

                    case JwLibraryFileDataTypes.Bookmark:
                        return BackupFile?.Database.Bookmarks;

                    case JwLibraryFileDataTypes.InputField:
                        return BackupFile?.Database.InputFields;

                    case JwLibraryFileDataTypes.Note:
                        return BackupFile?.Database.Notes;

                    case JwLibraryFileDataTypes.LastModified:
                        return BackupFile != null
                            ? new List<LastModified> { BackupFile.Database.LastModified }
                            : null;

                    case JwLibraryFileDataTypes.Tag:
                        return BackupFile?.Database.Tags;

                    case JwLibraryFileDataTypes.TagMap:
                        return BackupFile?.Database.TagMaps;

                    case JwLibraryFileDataTypes.UserMark:
                        return BackupFile?.Database.UserMarks;

                    case JwLibraryFileDataTypes.Manifest:
                        return ManifestAsItemsSource(BackupFile?.Manifest);

                    case JwLibraryFileDataTypes.Playlist:
                        return BackupFile?.Database.PlaylistItems;
                }
            }

            return null;
        }
    }

    public bool IsNotesItemSelected => SelectedDataType?.DataType == JwLibraryFileDataTypes.Note;

    private static List<KeyValuePair<string, string>> ManifestAsItemsSource(Manifest? manifest)
    {
        var result = new List<KeyValuePair<string, string>>();

        if (manifest != null)
        {
            result.Add(new KeyValuePair<string, string>("Name", manifest.Name));
            result.Add(new KeyValuePair<string, string>("Created", manifest.CreationDate));
            result.Add(new KeyValuePair<string, string>("Version", manifest.Version.ToString(CultureInfo.InvariantCulture)));
            result.Add(new KeyValuePair<string, string>("Type", manifest.Type.ToString(CultureInfo.InvariantCulture)));
            result.Add(new KeyValuePair<string, string>("LastModified", manifest.UserDataBackup.LastModifiedDate));
            result.Add(new KeyValuePair<string, string>("Device", manifest.UserDataBackup.DeviceName));
            result.Add(new KeyValuePair<string, string>("Database", manifest.UserDataBackup.DatabaseName));
            result.Add(new KeyValuePair<string, string>("Hash", manifest.UserDataBackup.Hash));
            result.Add(new KeyValuePair<string, string>("SchemaVersion", manifest.UserDataBackup.SchemaVersion.ToString(CultureInfo.InvariantCulture)));
        }

        return result;
    }

    private static List<DataTypeListItem> CreateListItems() =>
        [
            new("Manifest", JwLibraryFileDataTypes.Manifest),
            new("Block Range", JwLibraryFileDataTypes.BlockRange),
            new("Bookmark", JwLibraryFileDataTypes.Bookmark),
            new("InputField", JwLibraryFileDataTypes.InputField),
            new("Last Modified", JwLibraryFileDataTypes.LastModified),
            new("Location", JwLibraryFileDataTypes.Location),
            new("Note", JwLibraryFileDataTypes.Note),
            new("Tag", JwLibraryFileDataTypes.Tag),
            new("Tag Map", JwLibraryFileDataTypes.TagMap),
            new("User Mark", JwLibraryFileDataTypes.UserMark),
            new("Playlist", JwLibraryFileDataTypes.Playlist),
        ];
}