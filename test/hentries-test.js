/*

Copyright 2017 AJ Jordan <alex@strugee.net>.

This file is part of lazymention.

lazymention is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

lazymention is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with lazymention. If not, see
<https://www.gnu.org/licenses/>.

*/

'use strict';

var vows = require('perjury'),
    assert = vows.assert,
    mf2 = require('microformat-node'),
    express = require('express'),
    fs = require('fs'),
    path = require('path'),
    noopLog = require('./lib/log');

vows.describe('h-entry canonicalization module').addBatch({
	'When we set up a server to serve posts': {
		topic: function() {
			var app = express();

			app.use(express.static(path.join(__dirname, 'data'), {
				extensions: ['html']
			}));

			app.listen(47298, this.callback);
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'and we require the module': {
			topic: function() {
				return require('../dist/hentries');
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'it exports a factory function': function(err, makeHentriesHandler) {
				assert.isFunction(makeHentriesHandler);
			},
			'and we create a node handler instance': {
				topic: function(makeHentriesHandler) {
					return makeHentriesHandler(noopLog);
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'it returns a  function': function(err, handleNode) {
					assert.isFunction(handleNode);
				},
				// XXX make more sample files
				'and we pass it an h-feed with some h-entries': {
					topic: function(handleNode) {
						var cb = this.callback;

						fs.readFile(path.join(__dirname, 'data/h-feed-with-h-entries.html'), function(err, data) {
							if (err) {
								cb(err);
								return;
							}

							mf2.get({html: data.toString()}, function(_err, _data) {
								if (err) {
									cb(err);
									return;
								}

								handleNode('http://localhost:47298', _data.items[0], function(err, arr) {
									if (err) {
										cb(err);
										return;
									}

									cb(undefined, arr);
								});
							});
						});
					},
					'it works': function(err, arr) {
						assert.ifError(err);
					},
					'it has the structure we expect': function(err, arr) {
						assert.isArray(arr);
						arr.forEach(function(obj) {
							assert.isObject(obj);
							assert.equal(obj.resolvedUrl.slice(0, -1), 'http://localhost:47298/entry-');
							assert.isString(obj.html);
						});
					},
					'it has the right length': function(err, arr) {
						assert.equal(arr.length, 2);
					}
				}
			}
		}
	}
}).export(module);
