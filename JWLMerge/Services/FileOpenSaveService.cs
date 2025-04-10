﻿using JWLMerge.ImportExportServices.Models;
using System;
using System.IO;
using Microsoft.Win32;

namespace JWLMerge.Services;

internal sealed class FileOpenSaveService : IFileOpenSaveService
{
    private static string? ImportDirectory { get; set; }

    private static string? ExportDirectory { get; set; }

    private static int ExportFilterIndex { get; set; }

    public string? GetBibleNotesExportFilePath(string title)
    {
        var saveFileDialog = new SaveFileDialog
        {
            AddExtension = true,
            Title = title,
            Filter = "Excel file (*.xlsx)|*.xlsx|Text file (*.txt)|*.txt",
            FilterIndex = ExportFilterIndex,
            InitialDirectory = ExportDirectory ?? GetDefaultExportFolder(),
        };

        if (saveFileDialog.ShowDialog() == true)
        {
            ExportDirectory = Path.GetDirectoryName(saveFileDialog.FileName);
            ExportFilterIndex = saveFileDialog.FilterIndex;
            return saveFileDialog.FileName;
        }

        return null;
    }

    public ImportExportFileType GetFileType(string? fileName)
    {
        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(ext))
        {
            return ImportExportFileType.Unknown;
        }

        if (string.Equals(ext, ".txt", StringComparison.OrdinalIgnoreCase))
        {
            return ImportExportFileType.Text;
        }

        if (string.Equals(ext, ".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return ImportExportFileType.Excel;
        }

        return ImportExportFileType.Unknown;
    }

    public string? GetBibleNotesImportFilePath(string title)
    {
        var openFileDialog = new OpenFileDialog
        {
            AddExtension = true,
            CheckFileExists = true,
            DefaultExt = ".txt",
            Title = title,
            Filter = "Text file (*.txt)|*.txt",
            InitialDirectory = ImportDirectory ?? GetDefaultImportFolder(),
        };

        if (openFileDialog.ShowDialog() == true)
        {
            ImportDirectory = Path.GetDirectoryName(openFileDialog.FileName);
            return openFileDialog.FileName;
        }

        return null;
    }

    public string? GetSaveFilePath(string title)
    {
        var saveFileDialog = new SaveFileDialog
        {
            AddExtension = true,
            Title = title,
            Filter = "JW Library backup file (*.jwlibrary)|*.jwlibrary",
            InitialDirectory = Properties.Settings.Default.SaveDirectory ?? GetDefaultSaveFolder(),
            FileName = $"UserdataBackup_{DateTime.Now:yyyy-MM-dd}_JWLMerge",
        };
            
        if (saveFileDialog.ShowDialog() == true)
        {
            Properties.Settings.Default.SaveDirectory = Path.GetDirectoryName(saveFileDialog.FileName);
            Properties.Settings.Default.Save();
            return saveFileDialog.FileName;
        }
            
        return null;
    }

    public string[]? GetOpenFiles(string title)
    {
        var openFileDialog = new OpenFileDialog
        {
            Multiselect = true,
            CheckFileExists = true,
            CheckPathExists = true,
            Title = "Select one or more JW Library backup files",
            Filter = "JW Library backup file (*.jwlibrary)|*.jwlibrary",
            InitialDirectory = Properties.Settings.Default.SaveDirectory ?? GetDefaultSaveFolder(),
        };
        if (openFileDialog.ShowDialog() == true)
        {
            Properties.Settings.Default.SaveDirectory = Path.GetDirectoryName(openFileDialog.FileName);
            Properties.Settings.Default.Save();
            return openFileDialog.FileNames;
        }
        return null;
    }

    private static string GetJwlMergeDocsFolder()
    {
        var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "JWLMerge");
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }

        return folder;
    }

    private static string GetDefaultSaveFolder()
    {
        return GetJwlMergeDocsFolder();
    }

    private static string GetDefaultExportFolder()
    {
        return GetJwlMergeDocsFolder();
    }

    private static string GetDefaultImportFolder()
    {
        var folder = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }

        return folder;
    }
}