﻿import "./protos.js";
import { FormDialog } from "./formDialog.js";
import {
    allIcons as icons,
    emojiStyle,
    textStyle
} from "./emoji.js";
import {
    A,
    Button,
    Div,
    H1,
    H2,
    LI,
    Label,
    P,
    Span,
    UL
} from "./htmltags.js";
import {
    className,
    href,
    htmlFor,
    style,
    title,
    systemFamily,
    systemFont
} from "./htmlattrs.js";
import { onClick } from "./htmlevts.js";

const headerStyle = style({
        textDecoration: "none",
        color: "black",
        textTransform: "capitalize"
    }),
    buttonStyle = style({
        fontSize: "200%",
        width: "2em",
        fontFamily: systemFamily
    }),
    cancelEvt = new Event("emojiCanceled");

export class EmojiForm extends FormDialog {
    constructor() {
        super("Emoji");

        const emojiPreview = this.element.appendChild(Span(style({ gridArea: "4/1/5/4" }))),
            confirmEmojiButton = this.element.appendChild(Button(className("confirm"),
                style({ gridArea: "4/2" }),
                systemFont,
                "OK")),
            cancelEmojiButton = this.element.appendChild(Button(className("cancel"),
                style({ gridArea: "4/3" }),
                systemFont,
                "Cancel"));

        this.content.appendChild(H2("Recent"));
        const recentEmoji = this.content.appendChild(P("(None)"));

        const previousEmoji = [],
            allAlts = [];

        let selectedEmoji = null,
            idCounter = 0;

        const closeAll = () => {
            for (let alt of allAlts) {
                alt.hide();
            }
        }

        function combine(a, b) {
            let left = a.value;

            let idx = left.indexOf(emojiStyle.value);
            if (idx === -1) {
                idx = left.indexOf(textStyle.value);
            }
            if (idx >= 0) {
                left = left.substring(0, idx);
            }

            return {
                value: left + b.value,
                desc: a.desc + "/" + b.desc
            };
        }

        const addIconsToContainer = (group, container, isAlts) => {
            for (let icon of group) {
                const g = isAlts ? UL() : Span(),
                    btn = Button(
                        title(icon.desc),
                        buttonStyle,
                        onClick((evt) => {
                            selectedEmoji = selectedEmoji && evt.ctrlKey
                                ? combine(selectedEmoji, icon)
                                : icon;
                            emojiPreview.innerHTML = `${selectedEmoji.value} - ${selectedEmoji.desc}`;
                            confirmEmojiButton.unlock();

                            if (!!alts) {
                                alts.toggleOpen();
                                btn.innerHTML = icon.value + (alts.isOpen() ? "-" : "+");
                            }
                        }), icon.value);

                let alts = null;

                if (isAlts) {
                    btn.id = `emoji-with-alt-${idCounter++}`;
                    g.appendChild(LI(btn,
                        Label(htmlFor(btn.id),
                            icon.desc)));
                }
                else {
                    g.appendChild(btn);
                }

                if (!!icon.alt) {
                    alts = Div();
                    allAlts.push(alts);
                    addIconsToContainer(icon.alt, alts, true);
                    alts.hide();
                    g.appendChild(alts);
                    btn.style.width = "3em";
                    btn.innerHTML += "+";
                }

                if (!!icon.width) {
                    btn.style.width = icon.width;
                }

                if (!!icon.color) {
                    btn.style.color = icon.color;
                }

                container.appendChild(g);
            }
        };

        for (let key of Object.keys(icons)) {
            if (key !== "combiners") {
                const header = H1(),
                    container = P(),
                    headerButton = A(
                        href("javascript:undefined"),
                        title(key),
                        headerStyle,
                        onClick(() => {
                            container.toggleOpen();
                            headerButton.innerHTML = key + (container.isOpen() ? " -" : " +");
                        }),
                        key + " -"),
                    group = icons[key];

                addIconsToContainer(group, container);
                header.appendChild(headerButton);
                this.content.appendChild(header);
                this.content.appendChild(container);
            }
        }

        confirmEmojiButton.lock();
        this.hide();

        confirmEmojiButton.addEventListener("click", () => {
            const idx = previousEmoji.indexOf(selectedEmoji);
            if (idx === -1) {
                previousEmoji.push(selectedEmoji);
                recentEmoji.innerHTML = "";
                addIconsToContainer(previousEmoji, recentEmoji);
            }

            this.hide();
            this.dispatchEvent(new EmojiSelectedEvent(selectedEmoji));
        });

        cancelEmojiButton.addEventListener("click", () => {
            confirmEmojiButton.lock();
            this.hide();
            this.dispatchEvent(cancelEvt);
        });

        this.isOpen = this.element.isOpen.bind(this.element);

        this.selectAsync = () => {
            return new Promise((resolve, reject) => {
                let yes = null,
                    no = null;

                const done = () => {
                    this.removeEventListener("emojiSelected", yes);
                    this.removeEventListener("emojiCanceled", no);
                };

                yes = (evt) => {
                    done();
                    try {
                        resolve(evt.emoji);
                    }
                    catch (exp) {
                        reject(exp);
                    }
                };

                no = () => {
                    done();
                    resolve(null);
                };

                this.addEventListener("emojiSelected", yes);
                this.addEventListener("emojiCanceled", no);

                closeAll();
                this.show();
            });
        };
    }
}

class EmojiSelectedEvent extends Event {
    constructor(emoji) {
        super("emojiSelected");
        this.emoji = emoji;
    }
}