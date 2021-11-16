"use strict";
exports.__esModule = true;
exports.MeetingDocumentType = exports.MeetingType = exports.AccessType = exports.FileType = exports.Utskott = exports.PostType = exports.ArticleType = exports.AccessResourceType = void 0;
var AccessResourceType;
(function (AccessResourceType) {
    AccessResourceType["Door"] = "DOOR";
    AccessResourceType["Web"] = "WEB";
})(AccessResourceType = exports.AccessResourceType || (exports.AccessResourceType = {}));
/** News are the ones to be used by a website newsreel */
var ArticleType;
(function (ArticleType) {
    ArticleType["News"] = "news";
    ArticleType["Information"] = "information";
})(ArticleType = exports.ArticleType || (exports.ArticleType = {}));
/** Hur en post tillsätts enligt Reglementet */
var PostType;
(function (PostType) {
    /**
     * Erfoderligt antal, dvs. så många som anses
     * passande
     */
    PostType["Ea"] = "EA";
    /** Exakt _n_ stycken */
    PostType["ExactN"] = "EXACT_N";
    /** Upp till _n_ stycken */
    PostType["N"] = "N";
    /** Unik, finns bara 1, t.ex. utskottsordförande */
    PostType["U"] = "U";
})(PostType = exports.PostType || (exports.PostType = {}));
var Utskott;
(function (Utskott) {
    Utskott["Cm"] = "CM";
    Utskott["E6"] = "E6";
    Utskott["Enu"] = "ENU";
    Utskott["Fvu"] = "FVU";
    Utskott["Infu"] = "INFU";
    Utskott["Km"] = "KM";
    Utskott["Noju"] = "NOJU";
    Utskott["Nollu"] = "NOLLU";
    Utskott["Other"] = "OTHER";
    Utskott["Sre"] = "SRE";
    Utskott["Styrelsen"] = "STYRELSEN";
})(Utskott = exports.Utskott || (exports.Utskott = {}));
var FileType;
(function (FileType) {
    FileType["Code"] = "code";
    FileType["Folder"] = "folder";
    FileType["Image"] = "image";
    FileType["Other"] = "other";
    FileType["Pdf"] = "pdf";
    FileType["Powerpoint"] = "powerpoint";
    FileType["Spreadsheet"] = "spreadsheet";
    FileType["Text"] = "text";
})(FileType = exports.FileType || (exports.FileType = {}));
var AccessType;
(function (AccessType) {
    AccessType["Admin"] = "admin";
    AccessType["Authenticated"] = "authenticated";
    AccessType["Public"] = "public";
})(AccessType = exports.AccessType || (exports.AccessType = {}));
var MeetingType;
(function (MeetingType) {
    /** Styrelsemöte */
    MeetingType["Sm"] = "SM";
    /** Höstterminsmöte */
    MeetingType["Htm"] = "HTM";
    /** Valmöte */
    MeetingType["Vm"] = "VM";
    /** Vårterminsmöte */
    MeetingType["Vtm"] = "VTM";
    /** Extrainsatt Sektionsmöte */
    MeetingType["Extra"] = "Extra";
})(MeetingType = exports.MeetingType || (exports.MeetingType = {}));
var MeetingDocumentType;
(function (MeetingDocumentType) {
    /** Kallelse */
    MeetingDocumentType["Summons"] = "summons";
    /** Handlingar */
    MeetingDocumentType["Documents"] = "documents";
    MeetingDocumentType["LateDocuments"] = "lateDocuments";
    MeetingDocumentType["Protocol"] = "protocol";
})(MeetingDocumentType = exports.MeetingDocumentType || (exports.MeetingDocumentType = {}));
