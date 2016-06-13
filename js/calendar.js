(function (namespace) {
    var Calendar = function (_opts) {
        var _this = this,
            debug = true,
            DAY = 24 * 60 * 60 * 1000;

        // options
        _this.opts = {
            calID            : 'cal',
            date             : new Date(),
            tblID            : 'cal-body',
            todayID          : 'today',
            dateTextID       : 'date-str',
            nextMonthID      : 'next-month',
            prevMonthID      : 'prev-month',
            addBtnID         : 'add-event-btn', 
            addPopupID       : 'add-event-fast',
            addPopupCloseID  : 'close-fast-popup',
            createEventID    : 'add-event',
            createBtnID      : 'evt-text',
            fullEventID      : 'full-event',
            fullEventCloseID : 'close-full-event'
        };
        
        this.setOptions(_opts);

        _this.editedEventDate = "";
        _this.editedEventElement = null;

        var pad = function (num, pad) {
            var s = "000" + num;
            return s.substr(s.length-pad);
        };
        
        var dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
        var monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        var monthNamesAdv = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

        // set curDate
        //_this.curDate = (opts.date) ? opts.date : new Date();
        _this.curDate = _this.opts.date;
        debug && console.log('**************** ' + _this.curDate);

        _this.hasClass = function (el,cls) {
            return el.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
        };
        _this.addClass = function (el,cls) {
            if (!_this.hasClass(el,cls)) {
                el.className += " "+cls;
            }
        };
        _this.removeClass = function (el,cls) {
            if (_this.hasClass(el,cls)) {
                var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
                el.className=el.className.replace(reg,' ');
            }
        };

        _this.events = (localStorage && localStorage.getItem('calEvents')) ? JSON.parse(localStorage.getItem('calEvents')) : {};
        debug && console.log('events', _this.events);

        _this.cellsData = {};
        _this.removeSelection = function () {
            var c;

            for (c in this.cellsData) {
                if (this.cellsData.hasOwnProperty(c)) {
                    _this.cellsData[c].unselect();
                }
            }
        };

        this.setDateText = function () {
            if (_this.opts.dateTextID) {
                var el = document.getElementById(_this.opts.dateTextID);
                el.innerHTML = monthNames[_this.opts.date.getMonth()] + " " + _this.opts.date.getFullYear();
            }
        };

        this.showToday = function () {
            var el;

            if (this.opts.todayID) {
                el = document.getElementById(_this.opts.todayID);

                el.onclick = function () {
                    _this.opts.date = new Date();
                    _this.init(_this.opts);
                    return false;
                };
            }
        };

        this.initNextMonthButton = function () {
            var el;

            if (_this.opts.nextMonthID) {
                el = document.getElementById(_this.opts.nextMonthID);
                el.onclick = function () {
                    var d = _this.opts.date;
                    d.setMonth(d.getMonth()+1);
                    _this.opts.date = d;
                    _this.init(_this.opts);
                    return false;
                };
            }
        };

        this.initPrevMonthButton = function () {
            var el;

            if (_this.opts.prevMonthID) {
                el = document.getElementById(_this.opts.prevMonthID);
                el.onclick = function () {
                    var d = _this.opts.date;
                    d.setMonth(d.getMonth()-1);
                    _this.opts.date = d;
                    _this.init(_this.opts);
                    return false;
                };
            }
        };

        this.initAddEventButton = function () {
            var el;

            if (_this.opts.addBtnID && _this.opts.addPopupID && _this.opts.addPopupCloseID) {
                el = document.getElementById(_this.opts.addBtnID);
                el.onclick = function (e) {
                    var inp;

                    _this.addClass(el, 'active');
                    inp = document.getElementById(_this.opts.createBtnID);
                    inp.value = "";
                    e = document.getElementById(_this.opts.addPopupID);
                    e.style.display = 'block';
                    document.getElementById(_this.opts.addPopupCloseID).onclick = function () {
                        _this.removeClass(el, 'active');
                        e.style.display = "none";
                    };
                    _this.initCreateEventButton();
                    return false;
                };
            }
        };

        this.hidePopup = function () {
            var el = document.getElementById(_this.opts.addBtnID),
                e;

            _this.removeClass(el, 'active');
            e = document.getElementById(_this.opts.addPopupID);
            e.style.display = "none";
        };

        this.initCreateEventButton = function () {
            var el;

            if (_this.opts.createEventID) {
                el = document.getElementById(_this.opts.createEventID);

                el.onclick = function () {
                    var inp = document.getElementById(_this.opts.createBtnID),
                        val = inp.value,
                        evtArr, dt, mon, _evt, hash, c;

                    if (val.length > 5 && val.indexOf(',') !== -1) {
                        evtArr = val.split(',');
                        dt = evtArr[0].split(' ')[0];
                        mon = parseInt(monthNamesAdv.indexOf(_this.capitalize(evtArr[0].split(' ')[1]))) + 1;
                        _evt = {
                                name : evtArr[1],
                                participants : "",
                                description : ""
                            };
                        hash = dt+'-'+mon+'-'+_this.opts.date.getFullYear();
                        c = null;
                        if (_this.cellsData[hash]) {
                            c = _this.cellsData[hash];
                            c.setEvent(_evt);
                        } else {
                            _this.events[hash] = _evt;
                        }
                        _this.hidePopup();
                        // go to this date
                        _this.opts.date = new Date(_this.opts.date.getFullYear(), (parseInt(mon)-1), dt);
                        _this.init(_this.opts);
                        _this.cellsData[hash].el.getElementsByTagName('div')[0].click();
                    }
                    return false;
                };
            }
        };

        this.capitalize = function (s) {
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        };

        this.fullPopupClose = function () {
            var fe = document.getElementById(_this.opts.fullEventID);
            fe.style.display = "none";
            _this.removeSelection();
        };

        this.showFullEvent = function (el) {
            var pos, fe, fec, _evt, eventName, _cell, _date, p, capt, 
                pText, pName, descr, pDescr, tDescr, feCtrl, save, remove;

            if (_this.opts.fullEventID) {
                pos = _this.findPos(el.parentNode);
                // fe - full-event
                fe = document.getElementById(_this.opts.fullEventID);
                fe.style.display = "block";
                fe.style.left = (pos[0]+110)+'px';
                fe.style.top = ((pos[1])+(window.scrollY || 0)-38)+'px';

                // clear content
                fec = document.getElementById('fe-content');
                fec.innerHTML = "";

                // close button
                document.getElementById(_this.opts.fullEventCloseID).onclick = function () {
                    _this.fullPopupClose();
                };

                // show fields
                _evt = _this.events[el.parentNode.getAttribute('data-date-str')];
                _cell = _this.cellsData[el.parentNode.getAttribute('data-date-str')];
                _this.editedEventDate = el.parentNode.getAttribute('data-date-str');
                //_this.editedEventElement = el.parentNode;
                if (_evt && _evt.name) {
                    eventName = _this.createElement('h2', {id : 'event-name'});
                    eventName.innerHTML = _evt.name;
                } else {
                    eventName = _this.createElement('input', {
                        id : 'event-name-input',
                        placeholder : 'Событие',
                        type : 'text'
                    });
                }
                fec.appendChild(eventName);

                _date = _this.createElement('div', {id:"date"}, 'field');
                _date.innerHTML = _cell.dt.getDate() + ' ' + monthNamesAdv[_cell.dt.getMonth()];
                fec.appendChild(_date);

                p = _this.createElement('div', {id: 'participants'});
                if (_evt && _evt.participants) {
                    capt = _this.createElement('p', null, 'caption');
                    capt.innerText = 'Участники';
                    p.appendChild(capt);
                    pText = _this.createElement('p', {id: 'p-text'}, 'field');
                    pText.innerText = _evt.participants;
                    p.appendChild(pText);
                } else {
                    pName = _this.createElement('input', {
                        id: 'p-name',
                        type: 'text',
                        placeholder: 'Имена участников'
                    });
                    p.appendChild(pName);
                }
                fec.appendChild(p);
                descr = _this.createElement('p', {id: 'description'});
                if (_evt && _evt.description) {
                    pDescr = _this.createElement('p', {id: 't-description'}, 'field');
                    pDescr.innerText = _evt.description;
                    descr.appendChild(pDescr);
                } else {
                    tDescr = _this.createElement('textarea', {
                        id: 't-description',
                        cols: 30,
                        rowd: 30,
                        placeholder: 'Описание'
                    });
                    descr.appendChild(tDescr);
                }
                fec.appendChild(descr);
                feCtrl = _this.createElement('div', {id: 'full-event-controls'});
                save = _this.createElement('a', {
                    id: 'fec-save',
                    href: '#'
                }, 'rnd-button');
                save.innerHTML = "Готово";
                save.onclick = function (e) {
                    _this.saveEventBtnClick(e);
                    return false;
                };
                remove = _this.createElement('a', {
                    id: 'fec-remove',
                    href: '#'
                }, 'rnd-button');
                remove.innerHTML = "Удалить";
                remove.onclick = function (e) {
                    _this.removeEventBtnClick(e);
                    return false;
                };
                feCtrl.appendChild(save);
                feCtrl.appendChild(remove);
                fec.appendChild(feCtrl);
            }
        };

        this.saveEventBtnClick = function () {
            var e, _cell;

            e = _this.events[_this.editedEventDate] || {};
            e.name = (document.getElementById('event-name-input')) ? document.getElementById('event-name-input').value : e.name;
            e.participants = (document.getElementById('p-name')) ? document.getElementById('p-name').value : e.participants;
            e.description =(document.getElementById('t-description')) ? document.getElementById('t-description').value : e.description;
            //var el = _this.events[_this.editedEventElement];
            _cell = _this.cellsData[_this.editedEventDate];
            _cell.setEvent(e);
            _this.editedEventDate = "";
            //_this.editedEventElement = null;
            _this.fullPopupClose();
        };
        this.removeEventBtnClick = function () {
            var _cell = _this.cellsData[_this.editedEventDate];
            _cell.unsetEvent();
            _this.editedEventDate = "";
            _this.editedEventElement = null;
            _this.fullPopupClose();
        };

        this.createElement = function (el, attrs, className) {
            var _el = document.createElement(el),
                attr;

            for (attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    _el.setAttribute(attr, attrs[attr]);
                }
            }
            if (className) {
                _el.className = className;
            }
            return _el;
        };

        this.findPos = function (obj) {
            var curleft = 0, 
                curtop = 0,
                pos, thewindow;

            if (obj.offsetLeft) {
                curleft += parseInt(obj.offsetLeft);
            }
            if (obj.offsetTop) {
                curtop += parseInt(obj.offsetTop);
            }
            if (obj.scrollTop && obj.scrollTop > 0) {
                curtop -= parseInt(obj.scrollTop);
            }
            if (obj.offsetParent) {
                pos = _this.findPos(obj.offsetParent);
                curleft += pos[0];
                curtop += pos[1];
            } else if(obj.ownerDocument) {
                thewindow = obj.ownerDocument.defaultView;
                if (!thewindow && obj.ownerDocument.parentWindow) {
                    thewindow = obj.ownerDocument.parentWindow;
                }
                if (thewindow) {
                    if (thewindow.frameElement) {
                        pos = _this.findPos(thewindow.frameElement);
                        curleft += pos[0];
                        curtop += pos[1];
                    }
                }
            }

            return [curleft,curtop];
        };

        var Cell = function (_d, col, el, isFirstRow) {
            var _cell = this;

            this.isToday = false;
            this.dateStr = "";
            this.evt = {
                name : "",
                participants : "",
                description : ""
            };
            this.dt = null;
            this.el = null;
            this._selected = false;
            this._hasEvent = false;
            this._isFirstLine = false;
            this._dayIdx = null;

            this.init = function (_d, col, el, isFirstRow) {
                var div, d;

                _cell.dt = _d;
                _cell._isFirstRow = isFirstRow;
                _cell._dayIdx = col - 1;
                _cell.dateStr = _d.getDate()+'-'+(_d.getMonth()+1)+'-'+_d.getFullYear();
                div = document.createElement('div');
                d = new Date();
                if (_cell.dateStr === (d.getDate()+'-'+(d.getMonth()+1)+'-'+d.getFullYear())) {
                    _cell.isToday = true;
                    div.className = "today";
                }
                //div.innerHTML = (isFirstRow) ? dayNames[col-1] + ', ' + _d.getDate() : _d.getDate().toString();
                div.innerHTML = _cell.getDate();
                el.appendChild(div);
                el.setAttribute('data-date-str', _cell.dateStr);
                _cell.setElement(el);
                _this.cellsData[_cell.dateStr] = _cell; 
                if (_this.events[_cell.dateStr]) {
                    _cell.setEvent(_this.events[_cell.dateStr]);
                }
            };

            this.getDate = function () {
                return (_cell._isFirstRow) ? dayNames[_cell._dayIdx] + ', ' + _cell.dt.getDate() : _cell.dt.getDate().toString();
            };

            this.onclick = function (e) {
                // open event popup
                _this.removeSelection();
                _cell.select();
                _this.showFullEvent(e.target);
            };

            this.setElement = function (_el) {
                this.el = _el;
                this.el.onclick = this.onclick;
            };

            this.select = function () {
                this._selected = true;
                _this.addClass(this.el.getElementsByTagName('div')[0], 'selected');
            };
            this.unselect = function () {
                if (this._selected) {
                    this._selected = false;
                    _this.removeClass(this.el.getElementsByTagName('div')[0], 'selected');
                }
            };
            this.setEvent = function (e) {
                _cell.evt = e;
                var html = _cell.getDate(),
                    div = _cell.el.getElementsByTagName('div')[0], 
                    delim = '<br>';

                _this.events[_cell.dateStr] = e;
                if (e.name) {
                    html += delim + e.name;
                }
                if (e.participants) {
                    html += delim + e.participants;
                }
                if (e.description) {
                    html += delim + e.description;
                }
                _this.addClass(div, 'has-event');
                div.innerHTML = html;
                _cell.saveEvents();
            };

            this.unsetEvent = function () {
                _cell.evt = null;
                _cell.el.getElementsByTagName('div')[0].innerHTML = _cell.getDate();
                _this.events[_cell.dateStr] = undefined;
                _this.removeClass(_cell.el.getElementsByTagName('div')[0], 'has-event');
                _cell.saveEvents();
            };

            this.saveEvents = function () {
                localStorage.setItem('calEvents', JSON.stringify(_this.events));
            };

            // init
            this.init(_d, col, el, isFirstRow);
        };

        var getPrevMonthDate = function (dt) {
            var d = new Date(dt.getTime());

            d.setMonth(d.getMonth()-1);
            return d;
        };

        // dt's month's first day of week
        var getFirstMonthsDay = function (dt) {
            return new Date(dt.getFullYear(), dt.getMonth(), 1).getDay();
            //return new Date((dt.getMonth()+1).toString()+'-01-'+dt.getFullYear().toString()).getDay();
        };

        // dt's month's first date
        var getFirstMonthsDate = function (dt) {
            return new Date(dt.getFullYear(), dt.getMonth(), 1);
        };

        // dt's month's last day of week
        var getLastMonthsDay = function (dt) {
            return new Date(new Date(dt.getFullYear(), dt.getMonth()+1, 1) - 1).getDay();
        };

        // last date in dt's month
        var getMonthsLastDate = function (dt) {
            return new Date(new Date(dt.getFullYear(), dt.getMonth()+1, 1) - 1).getDate();
        };

        var getPrevMonthDaysCnt = function (dt) {
            return (6 +  getFirstMonthsDay(dt)) % 7;
        };

        var getNextMonthDaysCnt = function (dt) {
            return (7 - getLastMonthsDay(dt)) % 7;
        };

        if (debug) {
            console.log('curMonth = ' + (_this.opts.date.getMonth()+1));
            console.log('daysBefore = ' + getPrevMonthDaysCnt(_this.opts.date));
            console.log('daysAfter = ' + getNextMonthDaysCnt(_this.opts.date));
            console.log('prevMonth = ' + getPrevMonthDate(_this.opts.date));
            console.log('lastDAY = ' + getMonthsLastDate(_this.opts.date));
        }

        // setup calendar
        this.init = function (o) {
            var i, col, isFirstRow, calStr, prevMonDaysCnt, curMonthDaysCnt, nextMonDaysCnt, tbl, tr, td, _d, _cell, _monthLastDate;

            _this.generateLayout();

            _this.calBody = document.getElementById(_this.opts.tblID);

            col = 1;
            isFirstRow = true;
            calStr = "Пн Вт Ср Чт Пт Сб Вс\n";
            prevMonDaysCnt = getPrevMonthDaysCnt(o.date); 
            curMonthDaysCnt = getMonthsLastDate(o.date);
            nextMonDaysCnt = getNextMonthDaysCnt(o.date);

            // init buttons
            _this.setDateText();
            _this.showToday();
            _this.initNextMonthButton();
            _this.initPrevMonthButton();
            _this.initAddEventButton();
            //_this.initCreateEventButton();

            tbl = _this.createElement('table', {id:'cal-tbl'});
            tr = tbl.insertRow(-1);

            // add prev month dates
            for (i = prevMonDaysCnt; i>0; i--) {
                td = tr.insertCell(-1);
                _d = new Date(getFirstMonthsDate(o.date).getTime() - (DAY * i));
                //var _cell = new Cell(_d.getDate()+'-'+(_d.getMonth()+2)+'-'+_d.getFullYear());
                //createCell(_d, _cell, col, td);
                _cell = new Cell(_d, col, td, isFirstRow);

                calStr += (col > 1) ? " " : "";
                calStr += pad(_d.getDate(), 2);
                col++;
                if (col === 8) {
                    tr = tbl.insertRow(-1);
                    col = 1;
                    calStr += "\n";
                    isFirstRow = false;
                }
            }

            // add cur month dates 
            for (i=0; i<curMonthDaysCnt; i++) {
                td = tr.insertCell(-1);
                _d = new Date(_this.opts.date.getFullYear(), _this.opts.date.getMonth(), i+1);
                _cell = new Cell(_d, col, td, isFirstRow);
                calStr += (col > 1) ? " " : "";
                calStr += pad(i+1, 2);
                col++;
                if (col === 8) {
                    tr = tbl.insertRow(-1);
                    col = 1;
                    if (debug) {
                        calStr += "\n";
                    }
                    isFirstRow = false;
                }
            }

            // add next moth dates
            for (i=0; i<nextMonDaysCnt; i++) {
                td = tr.insertCell(-1);
                _monthLastDate = new Date(_this.opts.date.getFullYear(), _this.opts.date.getMonth(), getMonthsLastDate(_this.opts.date));
                _d = new Date(_monthLastDate.getTime() + (DAY * (i+1)));
                _cell = new Cell(_d, col, td, isFirstRow);

                calStr += (col > 1) ? " " : "";
                calStr += pad(i+1, 2);
                col++;
                if (col === 8) {
                    col = 1;
                    calStr += "\n";
                }
            }

            _this.calBody.innerHTML = "";
            _this.calBody.appendChild(tbl);

            // show cal
            debug && console.log(calStr);
        };

        this.generateLayout = function () {
            var calContainer = document.getElementById(_this.opts.calID),
                eventPanel, addEventBtn, updateEventBtn, searchInput, searchIcon, controls, prevMon, prevMonImg, 
                dateStr, nextMon, nextMonImg, today, addEventFast, closeEventFast, eventText, createBtn, fullEvent, 
                closeFullEvent, feArrow, feAImg, feContent, aefArrow, aefAImg;

            calContainer.innerHTML = "";

            // create event panel
            eventPanel = _this.createElement('div', {}, 'event-panel');
            addEventBtn = _this.createElement('a', {
                id : 'add-event-btn',
                href : '#'
            }, 'button');
            addEventBtn.innerHTML = "Добавить";
            updateEventBtn = _this.createElement('a', {
                href : '#'
            }, 'button');
            updateEventBtn.innerHTML = "Обновить";
            searchInput = _this.createElement('input', {
                id : "search-events",
                placeholder : "Событие, дата или участник",
                type : "text"
            });
            searchIcon = _this.createElement('img', {src : "img/search.png"}, 'search-icon');
            eventPanel.appendChild(addEventBtn);
            eventPanel.appendChild(updateEventBtn);
            eventPanel.appendChild(searchInput);
            eventPanel.appendChild(searchIcon);
            calContainer.appendChild(eventPanel);
            // <<< panel added

            // create controls panel
            controls = _this.createElement('div', {id : 'controls', });
            prevMon = _this.createElement('a',{
                id : 'prev-month',
                href : '#'
            }, 'month-links');
            prevMonImg = _this.createElement('img', {src : "img/arr_prev.png", alt : "<<"});
            prevMon.appendChild(prevMonImg);
            dateStr = _this.createElement('span', {id : 'date-str'});
            nextMon = _this.createElement('a',{
                id : 'next-month',
                href : '#'
            }, 'month-links');
            nextMonImg = _this.createElement('img', {src : "img/arr_next.png", alt : ">>"});
            nextMon.appendChild(nextMonImg);
            today = _this.createElement('a', {id : 'today', href : '#'});
            today.innerHTML = "Сегодня";
            controls.appendChild(prevMon);
            controls.appendChild(dateStr);
            controls.appendChild(nextMon);
            controls.appendChild(today);
            calContainer.appendChild(controls);

            // add cal-body ;)
            calContainer.appendChild(_this.createElement('div', {id : 'cal-body'}));

            // add add-event-fast popup
            addEventFast = _this.createElement('div', {id : 'add-event-fast'});
            closeEventFast = _this.createElement('div', {id : 'close-fast-popup'}, 'close');
            closeEventFast.innerHTML = 'x';
            addEventFast.appendChild(closeEventFast);
            aefArrow = _this.createElement('div', {}, 'arrow');
            aefAImg = _this.createElement('img', {
                src : 'img/up-arrow.png',
                alt : ''
            });
            aefArrow.appendChild(aefAImg);
            addEventFast.appendChild(aefArrow);
            eventText = _this.createElement('input', {
                type : 'text',
                id : 'evt-text',
                placeholder : '5 Марта, День рождения',
            });
            addEventFast.appendChild(eventText);
            createBtn = _this.createElement('a', {
                href : "#",
                id : 'add-event'
            }, 'rnd-button');
            createBtn.innerHTML = 'Создать';
            addEventFast.appendChild(createBtn);
            calContainer.appendChild(addEventFast);

            // add full-event
            fullEvent = _this.createElement('div', {id : 'full-event'});
            closeFullEvent = _this.createElement('div', {id : 'close-full-event'}, 'close');
            closeFullEvent.innerHTML = 'x';
            fullEvent.appendChild(closeFullEvent);
            feArrow = _this.createElement('div', {}, 'arrow');
            feAImg = _this.createElement('img', {
                src : 'img/left-arrow.png',
                alt : '<'
            });
            feArrow.appendChild(feAImg);
            fullEvent.appendChild(feArrow);

            feContent = _this.createElement('div', {id : 'fe-content'});
            fullEvent.appendChild(feContent);

            calContainer.appendChild(fullEvent);
        };

        this.init(_this.opts);
    };

    Calendar.prototype.setOptions = function (opts) {        
        Object.keys(opts).forEach(function (key) {
            var opt;

            if (!opts.hasOwnProperty(key)) {
                return;
            }
            opt = opts[key];
            if (opt) {
                this.opts[key] = opt;
            }
        }.bind(this));
    };

    namespace.Instance = Calendar;
})(window.Calendar = window.Calendar || {});
