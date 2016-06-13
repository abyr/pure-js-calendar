(function (namespace) {
    var Cell, Calendar;

    var pad = function (num, pad) {
            var s = "000" + num;

            return s.substr(s.length - pad);
        },
        capitalize = function (s) {
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        },
        getFirstMonthsDayOfWeek = function (dt) {
            return new Date(dt.getFullYear(), dt.getMonth(), 1).getDay();
        },
        getFirstMonthsDate = function (dt) {
            return new Date(dt.getFullYear(), dt.getMonth(), 1);
        },
        getLastMonthsDayOfWeek = function (dt) {
            return new Date(new Date(dt.getFullYear(), dt.getMonth()+1, 1) - 1).getDay();
        },
        getMonthsLastDate = function (dt) {
            return new Date(new Date(dt.getFullYear(), dt.getMonth()+1, 1) - 1).getDate();
        },
        getPrevMonthDaysCnt = function (dt) {
            return (6 +  getFirstMonthsDayOfWeek(dt)) % 7;
        },
        getNextMonthDaysCnt = function (dt) {
            return (7 - getLastMonthsDayOfWeek(dt)) % 7;
        };

    var dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
        monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        monthNamesAdv = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'],
        DAY = 24 * 60 * 60 * 1000;

    Calendar = function (opts) {
        this.opts = {
            calID : 'cal',
            date : new Date(),
            tblID : 'cal-body',
            todayID : 'today',
            dateTextID : 'date-str',
            nextMonthID : 'next-month',
            prevMonthID : 'prev-month',
            addBtnID : 'add-event-btn',
            addPopupID : 'add-event-fast',
            addPopupCloseID : 'close-fast-popup',
            createEventID : 'add-event',
            createBtnID : 'evt-text',
            fullEventID : 'full-event',
            fullEventCloseID : 'close-full-event'
        };

        this.setOptions(opts);

        this.editedEventDate = "";
        this.editedEventElement = null;

        this.curDate = this.opts.date;

        this.events = this.geEvents();

        this.cellsData = {};

        this.init(this.opts);
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

    Calendar.prototype.geEvents = function () {
        var localyStored = localStorage && localStorage.getItem('calEvents') ;

        if (localyStored) {
            return JSON.parse(localyStored);
        }
        return {};
    };

    Calendar.prototype.setDateText = function () {
        var el;

        if (this.opts.dateTextID) {
            el = document.getElementById(this.opts.dateTextID);
            el.innerHTML = monthNames[this.opts.date.getMonth()] + " " + this.opts.date.getFullYear();
        }
    };

    Calendar.prototype.hasClass = function (el, cls) {
        return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    };

    Calendar.prototype.addClass = function (el, cls) {
        if (!this.hasClass(el, cls)) {
            el.className += " "+cls;
        }
    };

    Calendar.prototype.removeClass = function (el, cls) {
        var reg;

        if (this.hasClass(el, cls)) {
            reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            el.className=el.className.replace(reg, ' ');
        }
    };

    Calendar.prototype.removeSelection = function () {
        var c;

        for (c in this.cellsData) {
            if (this.cellsData.hasOwnProperty(c)) {
                this.cellsData[c].unselect();
            }
        }
    };

    Calendar.prototype.showToday = function () {
        var el;

        if (this.opts.todayID) {
            el = document.getElementById(this.opts.todayID);

            el.onclick = function () {
                this.opts.date = new Date();
                this.init(this.opts);
                return false;
            }.bind(this);
        }
    };

    Calendar.prototype.initNextMonthButton = function () {
        var el;

        if (this.opts.nextMonthID) {
            el = document.getElementById(this.opts.nextMonthID);
            el.onclick = function () {
                var d = this.opts.date;

                d.setMonth(d.getMonth()+1);
                this.opts.date = d;
                this.init(this.opts);
                return false;
            }.bind(this);
        }
    };

    Calendar.prototype.initPrevMonthButton = function () {
        var el;

        if (this.opts.prevMonthID) {
            el = document.getElementById(this.opts.prevMonthID);
            el.onclick = function () {
                var d = this.opts.date;

                d.setMonth(d.getMonth() - 1);
                this.opts.date = d;
                this.init(this.opts);
                return false;
            }.bind(this);
        }
    };

    Calendar.prototype.initAddEventButton = function () {
        var el;

        if (this.opts.addBtnID && this.opts.addPopupID && this.opts.addPopupCloseID) {
            el = document.getElementById(this.opts.addBtnID);
            el.onclick = function (e) {
                var inp;

                this.addClass(el, 'active');
                inp = document.getElementById(this.opts.createBtnID);
                inp.value = "";
                e = document.getElementById(this.opts.addPopupID);
                e.style.display = 'block';
                document.getElementById(this.opts.addPopupCloseID).onclick = function () {
                    this.removeClass(el, 'active');
                    e.style.display = "none";
                }.bind(this);
                this.initCreateEventButton();
                return false;
            }.bind(this);
        }
    };

    Calendar.prototype.hidePopup = function () {
        var el = document.getElementById(this.opts.addBtnID),
            e;

        this.removeClass(el, 'active');
        e = document.getElementById(this.opts.addPopupID);
        e.style.display = "none";
    };

    Calendar.prototype.initCreateEventButton = function () {
        var el;

        if (this.opts.createEventID) {
            el = document.getElementById(this.opts.createEventID);

            el.onclick = function () {
                var inp = document.getElementById(this.opts.createBtnID),
                    val = inp.value,
                    evtArr, dt, mon, _evt, hash, c;

                if (val.length > 5 && val.indexOf(',') !== -1) {
                    evtArr = val.split(',');
                    dt = evtArr[0].split(' ')[0];
                    mon = parseInt(monthNamesAdv.indexOf(capitalize(evtArr[0].split(' ')[1]))) + 1;
                    _evt = {
                            name : evtArr[1],
                            participants : "",
                            description : ""
                        };
                    hash = dt+'-' + mon + '-' + this.opts.date.getFullYear();
                    c = null;
                    if (this.cellsData[hash]) {
                        c = this.cellsData[hash];
                        c.setEvent(_evt);
                    } else {
                        this.events[hash] = _evt;
                    }
                    this.hidePopup();
                    // go to this date
                    this.opts.date = new Date(this.opts.date.getFullYear(), (parseInt(mon)-1), dt);
                    this.init(this.opts);
                    this.cellsData[hash].el.getElementsByTagName('div')[0].click();
                }
                return false;
            }.bind(this);
        }
    };

    Calendar.prototype.fullPopupClose = function () {
        var fe = document.getElementById(this.opts.fullEventID);

        fe.style.display = "none";
        this.removeSelection();
    };

    Calendar.prototype.showFullEvent = function (el) {
        var pos, fe, fec, _evt, eventName, _cell, _date, p, capt,
            pText, pName, descr, pDescr, tDescr, feCtrl, save, remove;

        if (this.opts.fullEventID) {
            pos = this.findPos(el.parentNode);
            // fe - full-event
            fe = document.getElementById(this.opts.fullEventID);
            fe.style.display = "block";
            fe.style.left = (pos[0]+110)+'px';
            fe.style.top = ((pos[1])+(window.scrollY || 0)-38)+'px';

            // clear content
            fec = document.getElementById('fe-content');
            fec.innerHTML = "";

            // close button
            document.getElementById(this.opts.fullEventCloseID).onclick = function () {
                this.fullPopupClose();
            }.bind(this);

            // show fields
            _evt = this.events[el.parentNode.getAttribute('data-date-str')];
            _cell = this.cellsData[el.parentNode.getAttribute('data-date-str')];
            this.editedEventDate = el.parentNode.getAttribute('data-date-str');

            if (_evt && _evt.name) {
                eventName = this.createElement('h2', {id : 'event-name'});
                eventName.innerHTML = _evt.name;
            } else {
                eventName = this.createElement('input', {
                    id : 'event-name-input',
                    placeholder : 'Событие',
                    type : 'text'
                });
            }
            fec.appendChild(eventName);

            _date = this.createElement('div', {id:"date"}, 'field');
            _date.innerHTML = _cell.dt.getDate() + ' ' + monthNamesAdv[_cell.dt.getMonth()];
            fec.appendChild(_date);

            p = this.createElement('div', {id: 'participants'});
            if (_evt && _evt.participants) {
                capt = this.createElement('p', null, 'caption');
                capt.innerText = 'Участники';
                p.appendChild(capt);
                pText = this.createElement('p', {id: 'p-text'}, 'field');
                pText.innerText = _evt.participants;
                p.appendChild(pText);
            } else {
                pName = this.createElement('input', {
                    id: 'p-name',
                    type: 'text',
                    placeholder: 'Имена участников'
                });
                p.appendChild(pName);
            }
            fec.appendChild(p);
            descr = this.createElement('p', {id: 'description'});
            if (_evt && _evt.description) {
                pDescr = this.createElement('p', {id: 't-description'}, 'field');
                pDescr.innerText = _evt.description;
                descr.appendChild(pDescr);
            } else {
                tDescr = this.createElement('textarea', {
                    id: 't-description',
                    cols: 30,
                    rowd: 30,
                    placeholder: 'Описание'
                });
                descr.appendChild(tDescr);
            }
            fec.appendChild(descr);
            feCtrl = this.createElement('div', {id: 'full-event-controls'});
            save = this.createElement('a', {
                id: 'fec-save',
                href: '#'
            }, 'rnd-button');
            save.innerHTML = "Готово";
            save.onclick = function (e) {
                this.saveEventBtnClick(e);
                return false;
            }.bind(this);
            remove = this.createElement('a', {
                id: 'fec-remove',
                href: '#'
            }, 'rnd-button');
            remove.innerHTML = "Удалить";

            remove.onclick = function (e) {
                this.removeEventBtnClick(e);
                return false;
            }.bind(this);

            feCtrl.appendChild(save);
            feCtrl.appendChild(remove);
            fec.appendChild(feCtrl);
        }
    };

    Calendar.prototype.saveEventBtnClick = function () {
        var e, _cell;

        e = this.events[this.editedEventDate] || {};
        e.name = (document.getElementById('event-name-input')) ? document.getElementById('event-name-input').value : e.name;
        e.participants = (document.getElementById('p-name')) ? document.getElementById('p-name').value : e.participants;
        e.description =(document.getElementById('t-description')) ? document.getElementById('t-description').value : e.description;

        _cell = this.cellsData[this.editedEventDate];
        _cell.setEvent(e);
        this.editedEventDate = "";

        this.fullPopupClose();
    };
    Calendar.prototype.removeEventBtnClick = function () {
        var _cell = this.cellsData[this.editedEventDate];

        _cell.unsetEvent();
        this.editedEventDate = "";
        this.editedEventElement = null;
        this.fullPopupClose();
    };

    Calendar.prototype.createElement = function (el, attrs, className) {
        var newEl = document.createElement(el),
            attr;

        for (attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                newEl.setAttribute(attr, attrs[attr]);
            }
        }
        if (className) {
            newEl.className = className;
        }
        return newEl;
    };

    Calendar.prototype.findPos = function (obj) {
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
            pos = this.findPos(obj.offsetParent);
            curleft += pos[0];
            curtop += pos[1];
        } else if (obj.ownerDocument) {
            thewindow = obj.ownerDocument.defaultView;
            if (!thewindow && obj.ownerDocument.parentWindow) {
                thewindow = obj.ownerDocument.parentWindow;
            }
            if (thewindow) {
                if (thewindow.frameElement) {
                    pos = this.findPos(thewindow.frameElement);
                    curleft += pos[0];
                    curtop += pos[1];
                }
            }
        }

        return [curleft,curtop];
    };

    Calendar.prototype.init = function (o) {
        var i, col, isFirstRow, calStr, prevMonDaysCnt, curMonthDaysCnt, nextMonDaysCnt, tbl, tr, td, _d, _cell, _monthLastDate;

        this.generateLayout();

        this.calBody = document.getElementById(this.opts.tblID);

        col = 1;
        isFirstRow = true;
        calStr = "Пн Вт Ср Чт Пт Сб Вс\n";
        prevMonDaysCnt = getPrevMonthDaysCnt(o.date);
        curMonthDaysCnt = getMonthsLastDate(o.date);
        nextMonDaysCnt = getNextMonthDaysCnt(o.date);

        // init buttons
        this.setDateText();
        this.showToday();
        this.initNextMonthButton();
        this.initPrevMonthButton();
        this.initAddEventButton();

        tbl = this.createElement('table', {id:'cal-tbl'});
        tr = tbl.insertRow(-1);

        // add prev month dates
        for (i = prevMonDaysCnt; i>0; i--) {
            td = tr.insertCell(-1);
            _d = new Date(getFirstMonthsDate(o.date).getTime() - (DAY * i));

            _cell = new Cell(_d, col, td, isFirstRow, this);

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
        for (i = 0; i < curMonthDaysCnt; i++) {
            td = tr.insertCell(-1);
            _d = new Date(this.opts.date.getFullYear(), this.opts.date.getMonth(), i+1);
            _cell = new Cell(_d, col, td, isFirstRow, this);

            calStr += (col > 1) ? " " : "";
            calStr += pad(i+1, 2);
            col++;
            if (col === 8) {
                tr = tbl.insertRow(-1);
                col = 1;
                isFirstRow = false;
            }
        }

        // add next moth dates
        for (i=0; i<nextMonDaysCnt; i++) {
            td = tr.insertCell(-1);
            _monthLastDate = new Date(this.opts.date.getFullYear(), this.opts.date.getMonth(), getMonthsLastDate(this.opts.date));
            _d = new Date(_monthLastDate.getTime() + (DAY * (i+1)));
            _cell = new Cell(_d, col, td, isFirstRow, this);

            calStr += (col > 1) ? " " : "";
            calStr += pad(i+1, 2);
            col++;
            if (col === 8) {
                col = 1;
                calStr += "\n";
            }
        }

        this.calBody.innerHTML = "";
        this.calBody.appendChild(tbl);
    };

    Calendar.prototype.generateLayout = function () {
        var calContainer = document.getElementById(this.opts.calID),
            eventPanel, addEventBtn, updateEventBtn, searchInput, searchIcon, controls, prevMon, prevMonImg,
            dateStr, nextMon, nextMonImg, today, addEventFast, closeEventFast, eventText, createBtn, fullEvent,
            closeFullEvent, feArrow, feAImg, feContent, aefArrow, aefAImg;

        calContainer.innerHTML = "";

        // create event panel
        eventPanel = this.createElement('div', {}, 'event-panel');
        addEventBtn = this.createElement('a', {
            id : 'add-event-btn',
            href : '#'
        }, 'button');
        addEventBtn.innerHTML = "Добавить";
        updateEventBtn = this.createElement('a', {
            href : '#'
        }, 'button');
        updateEventBtn.innerHTML = "Обновить";
        searchInput = this.createElement('input', {
            id : "search-events",
            placeholder : "Событие, дата или участник",
            type : "text"
        });
        searchIcon = this.createElement('img', {src : "img/search.png"}, 'search-icon');
        eventPanel.appendChild(addEventBtn);
        eventPanel.appendChild(updateEventBtn);
        eventPanel.appendChild(searchInput);
        eventPanel.appendChild(searchIcon);
        calContainer.appendChild(eventPanel);
        // <<< panel added

        // create controls panel
        controls = this.createElement('div', {id : 'controls', });
        prevMon = this.createElement('a',{
            id : 'prev-month',
            href : '#'
        }, 'month-links');
        prevMonImg = this.createElement('img', {src : "img/arr_prev.png", alt : "<<"});
        prevMon.appendChild(prevMonImg);
        dateStr = this.createElement('span', {id : 'date-str'});
        nextMon = this.createElement('a',{
            id : 'next-month',
            href : '#'
        }, 'month-links');
        nextMonImg = this.createElement('img', {src : "img/arr_next.png", alt : ">>"});
        nextMon.appendChild(nextMonImg);
        today = this.createElement('a', {id : 'today', href : '#'});
        today.innerHTML = "Сегодня";
        controls.appendChild(prevMon);
        controls.appendChild(dateStr);
        controls.appendChild(nextMon);
        controls.appendChild(today);
        calContainer.appendChild(controls);

        // add cal-body ;)
        calContainer.appendChild(this.createElement('div', {id : 'cal-body'}));

        // add add-event-fast popup
        addEventFast = this.createElement('div', {id : 'add-event-fast'});
        closeEventFast = this.createElement('div', {id : 'close-fast-popup'}, 'close');
        closeEventFast.innerHTML = 'x';
        addEventFast.appendChild(closeEventFast);
        aefArrow = this.createElement('div', {}, 'arrow');
        aefAImg = this.createElement('img', {
            src : 'img/up-arrow.png',
            alt : ''
        });
        aefArrow.appendChild(aefAImg);
        addEventFast.appendChild(aefArrow);
        eventText = this.createElement('input', {
            type : 'text',
            id : 'evt-text',
            placeholder : '5 Марта, День рождения',
        });
        addEventFast.appendChild(eventText);
        createBtn = this.createElement('a', {
            href : "#",
            id : 'add-event'
        }, 'rnd-button');
        createBtn.innerHTML = 'Создать';
        addEventFast.appendChild(createBtn);
        calContainer.appendChild(addEventFast);

        // add full-event
        fullEvent = this.createElement('div', {id : 'full-event'});
        closeFullEvent = this.createElement('div', {id : 'close-full-event'}, 'close');
        closeFullEvent.innerHTML = 'x';
        fullEvent.appendChild(closeFullEvent);
        feArrow = this.createElement('div', {}, 'arrow');
        feAImg = this.createElement('img', {
            src : 'img/left-arrow.png',
            alt : '<'
        });
        feArrow.appendChild(feAImg);
        fullEvent.appendChild(feArrow);

        feContent = this.createElement('div', {id : 'fe-content'});
        fullEvent.appendChild(feContent);

        calContainer.appendChild(fullEvent);
    };

    Cell = function (_d, col, el, isFirstRow, calendar) {
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

        this.setCalendar(calendar);

        this.init(_d, col, el, isFirstRow);
    };

    Cell.prototype.setCalendar = function (calendar) {
        this.calendar = calendar;
    };

    Cell.prototype.getCalendar = function () {
        return this.calendar;
    };

    Cell.prototype.init = function (_d, col, el, isFirstRow) {
        var calendar = this.getCalendar(),
            div, d;

        this.dt = _d;
        this._isFirstRow = isFirstRow;
        this._dayIdx = col - 1;
        this.dateStr = _d.getDate()+'-'+(_d.getMonth()+1)+'-'+_d.getFullYear();
        div = document.createElement('div');
        d = new Date();
        if (this.dateStr === (d.getDate()+'-'+(d.getMonth()+1)+'-'+d.getFullYear())) {
            this.isToday = true;
            div.className = "today";
        }
        div.innerHTML = this.getDate();
        el.appendChild(div);
        el.setAttribute('data-date-str', this.dateStr);
        this.setElement(el);
        calendar.cellsData[this.dateStr] = this;
        if (calendar.events[this.dateStr]) {
            this.setEvent(calendar.events[this.dateStr]);
        }
    };

    Cell.prototype.getDate = function () {
        return (this._isFirstRow) ? dayNames[this._dayIdx] + ', ' + this.dt.getDate() : this.dt.getDate().toString();
    };

    Cell.prototype.onclick = function (e) {
        var calendar = this.getCalendar();

        // open event popup
        calendar.removeSelection();
        this.select();
        calendar.showFullEvent(e.target);
    };

    Cell.prototype.setElement = function (_el) {
        this.el = _el;
        this.el.onclick = this.onclick.bind(this);
    };

    Cell.prototype.select = function () {
        var calendar = this.getCalendar();

        this._selected = true;
        calendar.addClass(this.el.getElementsByTagName('div')[0], 'selected');
    };
    Cell.prototype.unselect = function () {
        var calendar;

        if (this._selected) {
            calendar = this.getCalendar();
            this._selected = false;
            calendar.removeClass(this.el.getElementsByTagName('div')[0], 'selected');
        }
    };
    Cell.prototype.setEvent = function (e) {
        this.evt = e;

        var html = this.getDate(),
            div = this.el.getElementsByTagName('div')[0],
            delim = '<br>',
            calendar = this.getCalendar();

        calendar.events[this.dateStr] = e;
        if (e.name) {
            html += delim + e.name;
        }
        if (e.participants) {
            html += delim + e.participants;
        }
        if (e.description) {
            html += delim + e.description;
        }
        calendar.addClass(div, 'has-event');
        div.innerHTML = html;
        this.saveEvents();
    };

    Cell.prototype.unsetEvent = function () {
        var calendar = this.getCalendar();

        this.evt = null;
        this.el.getElementsByTagName('div')[0].innerHTML = this.getDate();
        calendar.events[this.dateStr] = undefined;
        calendar.removeClass(this.el.getElementsByTagName('div')[0], 'has-event');
        this.saveEvents();
    };

    Cell.prototype.saveEvents = function () {
        var calendar = this.getCalendar();

        localStorage.setItem('calEvents', JSON.stringify(calendar.events));
    };

    namespace.Instance = Calendar;
})(window.Calendar = window.Calendar || {});
