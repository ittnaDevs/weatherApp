#!/usr/bin/python
# -*- coding: UTF-8 -*-

# import os
from flask import Flask, session, redirect, url_for, escape, request, Response, render_template,make_response
from xml.dom.minidom import parse
import urllib
import cgitb
cgitb.enable()
import string
import json

from functools import wraps
app = Flask(__name__)
app.secret_key = "SOMEVERYSECRETKEY"

# dokumentissa tarvittavat nimiavaruudet
dc_ns = "http://purl.org/dc/elements/1.1/"
synd_ns = "http://purl.org/rss/1.0/modules/syndication/"
admin_ns = "http://webns.net/mvcb/"
rdf_ns = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
content_ns = "http://purl.org/rss/1.0/modules/content/"
atom_ns = "http://www.w3.org/2005/Atom"
doc= ""
link=[]
description=[]
title=[]
rights=[]
language=[]


@app.route('/hae_saatiedot', methods=['POST','GET'])
def saatiedot():
    url = u"Tyhjää!"
    virheet = []
    tulokset = {}
    update = ""
    sun = ""
    doc = ""
    otukset = []
    n = -1
    s = ""

    try:
        url = request.args.get('osoite',u"http://www.yr.no/place/Finland/Western_Finland/Jyv%C3%A4skyl%C3%A4/forecast.xml")
    except Exception as e:
        virheet.append(u'Tapahtui virhe haettaessa osoitetta: '+str(e))
    try:
        doc = parse( urllib.urlopen(url.encode('UTF-8')))
    except Exception as e:
        virheet.append(u'Tapahtui virhe parsittaessa osoitetta '+ url +'. Virhe: '+ str(e))

    if not len(virheet):
        linkki = doc.getElementsByTagName("link")
        linkki = linkki[0]
        linkkiteksti = linkki.getAttribute("text")
        linkkiURL = linkki.getAttribute("url")
        update = doc.getElementsByTagName("lastupdate")
        update = update[0].firstChild.nodeValue.replace('T'," ")
        sun = doc.getElementsByTagName("sun")[0]
        rise = sun.getAttribute("rise").replace('T'," ")
        sets = sun.getAttribute("set").replace('T'," ")

        tulokset['linkki'] = linkkiURL
        tulokset['teksti'] = linkkiteksti
        tulokset['update'] = update
        tulokset['rise'] = rise
        tulokset['sets'] = sets

        # Tasta otuksesta alkaen ruvetaan laittamaan otukset dictiin ja listaan
        times = doc.getElementsByTagName("time")
        # lista time-elementeista joiden sisalla on muita elementteja

        #making a dict from data and adding it to a list
        for i in times:
            n = n + 1
            tiedot = {}
            tmp = []
            tmp2 = []
            tmp3 = []
            aika = i.getAttribute('from')
            aika = aika.replace('T'," ")
            tiedot['time'] = aika
            #jaetaan ensimmainen paivamaara viela osiin
            tmp = aika.split(" ")
            tmp2 = tmp[0].split("-")
            tiedot['vuosi'] = tmp2[0]
            tiedot['kk'] = tmp2[1]
            tiedot['pp'] = tmp2[2]
            tmp3 = tmp[1].split(":")
            tiedot['h'] = tmp3[0]
            tiedot['m'] = tmp3[1]
            tiedot['s'] = tmp3[2]
            aika2= i.getAttribute('to')
            aika2 = aika2.replace('T'," ")
            tiedot['time2'] = aika2
            paine = i.getElementsByTagName("pressure")[0]
            tiedot['paine'] = paine.getAttribute("value")
            lampo = i.getElementsByTagName("temperature")[0]
            tiedot['lampo'] = lampo.getAttribute("value")
            tuulennopeus = i.getElementsByTagName("windSpeed")[0]
            # mailit kilometreiksi
            tuulennopeus = float(tuulennopeus.getAttribute("mps")) * 1.6
            txt = '{:8.2f}'.format(tuulennopeus)
            tiedot['tuulennopeus'] = txt
            tuulensuunta = i.getElementsByTagName("windDirection")[0]
            tiedot['tuulensuunta'] = tuulensuunta.getAttribute("code")
            sademaara = i.getElementsByTagName("precipitation")[0]
            tiedot['sade_min'] = sademaara.getAttribute("minvalue")
            tiedot['sade_max'] = sademaara.getAttribute("maxvalue")
            tiedot['sade_ksm'] = sademaara.getAttribute("value")
            symboli = i.getElementsByTagName("symbol")[0]
            tiedot['symboli'] = symboli.getAttribute("name")
            tiedot['n'] = n
            otukset.append(tiedot)

    tulokset['virhe'] = virheet
    tulokset['otukset'] = otukset
    resp = make_response(json.dumps(tulokset),200)
    resp.charset = "UTF-8"
    resp.mimetype = "application/json"
    return resp

@app.route('/hae_kaupungit', methods=['POST','GET'])
def kaupungit():
    url = ""
    try:
        url = request.form.get('alustus',"http://appro.mit.jyu.fi/web-sovellukset/vt/vt8/verda.txt")
    except Exception as e:
        url = "http://appro.mit.jyu.fi/web-sovellukset/vt/vt8/verda.txt"

    doc = ""
    virheet = []
    try:
        doc = urllib.urlopen(url.encode('UTF-8'))
    except Exception as e:
        virheet.append(u'Tapahtui virhe yritettäessä hakea kaupunkien tietoja.')

    otukset = []
    tulokset = {}
    if not len(virheet):
        s = ""
        for line in doc:
            tiedot = {}
            t = line.split('\t')
            if t[0] == "FI":
                if t[3] != s:
                    s = t[3]
                    tiedot['kaupunki'] = t[3].decode('utf-8')
                    tiedot['osoite'] = t[-1].decode('utf-8')
                    tiedot['longitude'] = t[-5]
                    tiedot['latitude'] = t[-6]
                    otukset.append(tiedot)
            # print str(t[0])
    tulokset['virhe'] = virheet
    tulokset['otukset'] = otukset
    resp = make_response(json.dumps(tulokset),200)
    resp.charset = "UTF-8"
    resp.mimetype = "application/json"
    return resp

############
if __name__ == '__main__':
    app.debug = True
    app.run(debug=True)
