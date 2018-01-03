{
    "translatorID": "5cf8bb21-e350-444f-b9b4-f46d9fab7827",
    "label": "DABI",
    "creator": "Jens Mittelbach",
    "target": "^https?://dabi\\.ib\\.hu-berlin\\.de/",
    "minVersion": "1.0",
    "maxVersion": "",
    "priority": 100,
    "inRepository": true,
    "translatorType": 4,
    "browserSupport": "gcsibv",
    "lastUpdated": "2016-01-08 11:43:21"
}
/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2018 Jens Mittelbach
	Contact: mail@jensmittelbach.de
    
	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/
function detectWeb(doc, url) {
    if (doc.title.trim().indexOf("DABI. Datensatz Vollanzeige") == 0) {
        return "journalArticle";
    } else if (doc.title.trim().indexOf("DABI: Rechercheergebnis") == 0) {
        var keinTreffer = doc.getElementsByTagName("br")[7].nextSibling.data.indexOf("Keine Treffer für die Suche nach:")
        if (keinTreffer == -1) {
            return "multiple";
        }
    }
}

function doWeb(doc, url) {
    var ids = [];

    if (detectWeb(doc, url) == "multiple") {
        Z.selectItems(getSearchResults(doc), function(items) {
            if (!items) return true;
            for (var i in items) {
                ids.push(i);
            }
        });
    } else if (detectWeb(doc, url) == "journalArticle") {
        //saves single page items
        ids = [url];
    }
    ZU.processDocuments(ids, scrape);
}


function getSearchResults(doc) {
    var trs = doc.getElementsByTagName("tr"),
        tds = null,
        items = {};

    for (var i = 1; i < trs.length; i++) {
        tds = trs[i].getElementsByTagName("td");
        for (var n = 0; n < tds.length; n++) {
            var url = doc.location.origin + "/cgi-bin/dabi/" + tds[0].firstChild.getAttribute("href"),
                author = tds[1].textContent,
                title = tds[2].textContent.replace(/<br>/g, '. ');

            if (author) {
                var item = title + " (" + author.replace(/;.*/, ' et al.') + ")";
            } else {
                var item = title;
            }
            if (!item || !url) continue;

            items[url] = item;
        }
    }
    return items;
}

function scrape(doc, url) {
    var newItem = new Zotero.Item('journalArticle');
    var trs = doc.getElementsByTagName("tr"),
        items = {};

    for (var i = 0; i < trs.length; i++) {
        var headers = trs[i].getElementsByTagName("th")[0].textContent;
        var contents = trs[i].getElementsByTagName("td")[0].innerHTML;

        items[headers.replace(/\s+/g, '')] = contents.trim();
    }

    //set url to fulltext resource, if present
	if (items["URL"]) {
		newItem.url = items["URL"].replace(/<a.*?href=\"(.*?)\".*/,"$1");

		if (/\.pdf(#.*)?$/.test(newItem.url)) {
			newItem.attachments = [{
				url: newItem.url,
				title: "DABI Full Text PDF",
				mimeType: "application/pdf"
			}];
		}
	}


    //Formatting and saving "title" fields
    //Sometimes titles are missing
    if (!items["Titel"]) {
        items["Titel"] = items["Untertitel"];
        delete items["Untertitel"];
    }
    
    if (items["Titel"]) {
        newItem.title = items["Titel"].replace(/\*/g, '');
        var short = newItem.title.replace(/^\W?(?:Die |Der |Das |\.{3}\s?)?/, '');
        short = short.replace(/\W?[,:?!."']/, '').split(' ').slice(0, 6).join(' ');
        newItem.shortTitle = short.substring(0, 1).toUpperCase() + short.slice(1);
        if (items["Untertitel"]) {
            if (/(\?|!|\.)\W?$/.test(newItem.title)) {
                newItem.title += " " + items["Untertitel"];
            } else {
                newItem.title += ": " + items["Untertitel"];
            }
        }
    }

    //Formatting and saving "Author" field
    if (items["Autoren"]) {
        var authors = items["Autoren"].split("; ");
        for (var i = 0; i < authors.length; i++) {
            newItem.creators.push(ZU.cleanAuthor(authors[i], "author", true));
        }
    }

	//Formatting and saving "pages" field
	 if (items["Anfangsseite"] > 0) {
		newItem.pages = items["Anfangsseite"] + (items["Endseite"] > items["Anfangsseite"] ? "-" + items["Endseite"] : "");
	}

    //Saving the tags to Zotero
    if (items["Schlagwörter"]) {
        newItem.tags = items["Schlagwörter"].split("; ");
    }

    //Making the publication title orthographic
    if (items["Zeitschrift"]) {
        newItem.publicationTitle = items["Zeitschrift"].replace(/ : /g, ": ");
    }

	//Associating and saving the well formatted data to Zotero
	newItem["date"] = items["Jahr"];
	newItem["issue"] = items["Heft"];
	newItem["volume"] = items["Band"];
	newItem["abstractNote"] = items["Abstract"];
	
    //Scrape is COMPLETE!
    newItem.complete();
} /** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://dabi.ib.hu-berlin.de/cgi-bin/dabi/vollanzeige.pl?artikel_id=13028&modus=html",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "\"Mich interessierten kostengünstige Alternativen zu Citavi\": Über den Fortbildungsworkshop \"Literaturverwaltung im Fokus\" im Rahmen der AGMB-Tagung 2012",
				"creators": [
					{
						"firstName": "Matti",
						"lastName": "Stöhr",
						"creatorType": "author"
					}
				],
				"date": "2012",
				"abstractNote": "Zum Programm der AGMB-Tagung 2012 in Aachen gehörte u.a. der zweistündige Fortbildungsworkshop \"Literaturverwaltung im Fokus - Softwaretypen, bibliothekarische Services und mehr\". Im Beitrag werden weniger die referierten Workshopinhalte beschrieben, als vielmehr die Perspektive der Teilnehmerinnen und Teilnehmer anhand einer eMail-basierten Umfrage vorgestellt. Die Kernfrage lautet hierbei: War der Workshop für sie gewinnbringend?",
				"issue": "3",
				"libraryCatalog": "DABI",
				"publicationTitle": "GMS Medizin, Bibliothek, Information",
				"shortTitle": "Mich interessierten kostengünstige Alternativen zu Citavi",
				"url": "http://www.egms.de/static/de/journals/mbi/2012-12/mbi000261.shtml",
				"volume": "12",
				"attachments": [],
				"tags": [
					{
						"tag": "Arbeitsgemeinschaft für Medizinisches Bibliothekswesen (AGMB)"
					},
					{
						"tag": "Citavi"
					},
					{
						"tag": "Literaturverwaltung"
					},
					{
						"tag": "Literaturverwaltungssoftware"
					},
					{
						"tag": "Tagung"
					},
					{
						"tag": "Teilnehmerumfrage"
					},
					{
						"tag": "Veranstaltungsbericht"
					},
					{
						"tag": "Workshop"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://dabi.ib.hu-berlin.de/cgi-bin/dabi/suche.pl?titel=&autor=st%F6hr&schlagwort=&styp=&notation=&zeitschrift=&jahr=&heft=&andor=AND&ordnung=titel&modus=html",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://dabi.ib.hu-berlin.de/cgi-bin/dabi/vollanzeige.pl?artikel_id=16013&modus=html",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "\"Frage stellen, Antwort bekommen, weiterarbeiten!\" - Umfrage zur Benutzung von UpToDate an den Universitäten Freiburg, Leipzig, Münster und Regensburg",
				"creators": [
					{
						"firstName": "Oliver",
						"lastName": "Obst",
						"creatorType": "author"
					},
					{
						"firstName": "Helge",
						"lastName": "Knüttel",
						"creatorType": "author"
					},
					{
						"firstName": "Christiane",
						"lastName": "Hofmann",
						"creatorType": "author"
					},
					{
						"firstName": "Petra",
						"lastName": "Zöller",
						"creatorType": "author"
					}
				],
				"date": "2013",
				"abstractNote": "UpToDate ist eine evidenzbasierte, von Ärzten erstellte Ressource zur Unterstützung der klinischen Entscheidungsfindung mit weitem Verbreitungsgrad in Deutschland. In einer Multicenter-Studie wurden Mediziner, Studierende, Wissenschaftler und sonstiges medizinisches Fachpersonal an vier deutschen Universitäten nach ihrer Nutzung und Beurteilung von UpToDate befragt. Insgesamt wurde die Umfrage 1.083-mal beantwortet, darunter von 540 Ärzten. 76% aller befragten Ärzte (aber nur 54% der Chefärzte) nutzten UpToDate. Die Unkenntnis über UpToDate betrug je nach Benutzergruppe zwischen 10 und 41%. 90 bis 95% aller klinisch tätigen Personen nannten als Hauptvorteil von UpToDate die schnelle, allgemeine Übersicht über Diagnose und Therapie von Erkrankungen. Jeder vierte Oberarzt wies auf verringerte Liegezeiten als Folge von UpToDate hin, (fast) jeder vierte Chefarzt gab an, dass UpToDate Kosten einspare. UpToDate ist eine wichtige, aber auch kostspielige Ressource in der Patientenbehandlung und sollte - angesichts der vorhandenen Unkenntnis über die Existenz dieser Ressource - stärker von den Bibliotheken beworben werden.",
				"issue": "3",
				"libraryCatalog": "DABI",
				"publicationTitle": "GMS Medizin, Bibliothek, Information",
				"shortTitle": "Frage stellen Antwort bekommen, weiterarbeiten!\" -",
				"url": "http://www.egms.de/static/de/journals/mbi/2013-13/mbi000290.shtml",
				"volume": "13",
				"attachments": [],
				"tags": [
					{
						"tag": "Freiburg"
					},
					{
						"tag": "Krankenversorgung"
					},
					{
						"tag": "Leipzig"
					},
					{
						"tag": "Medizin"
					},
					{
						"tag": "Medizinbibliothek"
					},
					{
						"tag": "Multicenter-Studie"
					},
					{
						"tag": "Münster"
					},
					{
						"tag": "Regensburg"
					},
					{
						"tag": "Umfrage"
					},
					{
						"tag": "Universität Freiburg"
					},
					{
						"tag": "Universität Leipzig"
					},
					{
						"tag": "Universität Münster"
					},
					{
						"tag": "Universität Regensburg"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://dabi.ib.hu-berlin.de/cgi-bin/dabi/vollanzeige.pl?artikel_id=21283&modus=html",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "\"Was ihr wollt!\" Nutzungsgesteuerter Einkauf von Medien an der Staatsbibliothek zu Berlin",
				"creators": [
					{
						"firstName": "Janin",
						"lastName": "Taubert",
						"creatorType": "author"
					}
				],
				"date": "2014",
				"issue": "3",
				"libraryCatalog": "DABI",
				"pages": "79-81",
				"publicationTitle": "Bibliotheks-Magazin",
				"shortTitle": "Was ihr wollt",
				"url": "http://staatsbibliothek-berlin.de/fileadmin/user_upload/zentrale_Seiten/ueber_uns/pdf/Bibliotheksmagazin/Bibliotheksmagazin_3-2014.pdf",
				"volume": "9",
				"attachments": [
					{
						"title": "DABI Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "Benutzerorientierter Bestandsaufbau"
					},
					{
						"tag": "Benutzerorientierung"
					},
					{
						"tag": "Berlin"
					},
					{
						"tag": "Bestand"
					},
					{
						"tag": "Bestandsaufbau"
					},
					{
						"tag": "Bibliothekswesen"
					},
					{
						"tag": "Demand Driven Acquisition (DDA)"
					},
					{
						"tag": "E-Book"
					},
					{
						"tag": "Evidence Based Selection (EBS)"
					},
					{
						"tag": "Kundenorientierter Bestandsaufbau"
					},
					{
						"tag": "Patron Driven Acquisition (PDA)"
					},
					{
						"tag": "Purchase On Demand (POD)"
					},
					{
						"tag": "Staatsbibliothek zu Berlin - Preußischer Kulturbesitz (SBB PK)"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://dabi.ib.hu-berlin.de/cgi-bin/dabi/vollanzeige.pl?artikel_id=5676&modus=html",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Anpassung der Personalstruktur der Fachhochschulbibliotheken in Nordrhein-Westfalen an die Erfordernisse der neunziger Jahre",
				"creators": [],
				"date": "1992",
				"issue": "1",
				"libraryCatalog": "DABI",
				"pages": "364-372",
				"publicationTitle": "Mitteilungsblatt des Verbandes der Bibliotheken des Landes Nordrhein-Westfalen",
				"shortTitle": "Anpassung der Personalstruktur der Fachhochschulbibliotheken in",
				"volume": "4",
				"attachments": [],
				"tags": [
					{
						"tag": "Nordrhein-Westfalen"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://dabi.ib.hu-berlin.de/cgi-bin/dabi/vollanzeige.pl?artikel_id=9481&modus=html",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "\"Das bibliophile Flaggschiff Bayerns\": Auszug aus der Rede des damaligen Ministerpräsidenten Dr. Günther Beckstein",
				"creators": [
					{
						"firstName": "Günther",
						"lastName": "Beckstein",
						"creatorType": "author"
					}
				],
				"date": "2009",
				"issue": "1",
				"libraryCatalog": "DABI",
				"pages": "46",
				"publicationTitle": "Bibliotheksforum Bayern",
				"shortTitle": "Bibliophile Flaggschiff Bayerns",
				"url": "http://www.bsb-muenchen.de/fileadmin/imageswww/pdf-dateien/bibliotheksforum/2009-1/BFB_0109_13%20Beckstein%20V06.pdf",
				"volume": "3",
				"attachments": [
					{
						"title": "DABI Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "Altes Buch"
					},
					{
						"tag": "Ausstellung"
					},
					{
						"tag": "Bayerische Staatsbibliothek (BSB) München"
					},
					{
						"tag": "Bibel"
					},
					{
						"tag": "Buchkunst"
					},
					{
						"tag": "Buchmalerei"
					},
					{
						"tag": "Handschrift"
					},
					{
						"tag": "Illustration"
					},
					{
						"tag": "Neues Testament"
					},
					{
						"tag": "Ottheinrich-Bibel"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
