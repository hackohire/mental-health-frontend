import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { tap } from 'rxjs/operators';
import * as moment from 'moment';
import { AuthService } from 'src/app/core/services/auth.service';
import { BlockToolData } from '@editorjs/editorjs';
import { CommentService } from '../../services/comment.service';
import { Comment } from '../../models/comment.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {

  @Input() comment: Comment;
  @Input() referenceId: string;
  @Output() updateRoot = new EventEmitter();
  replyCommentForm: FormGroup;
  reply: boolean;
  edit: boolean;
  replyEditorId: string;
  replyTextEditorData: BlockToolData;

  anonymousAvatar = require('src/assets/images/anonymous-avatar.jpg');
  mentalhealthBucketURL = environment.mentalhealthFilesBucket;

  constructor(
    public authService: AuthService,
    private commentService: CommentService
  ) { }

  ngOnInit() {
    // console.log(this.comment);
    this.initializeReplyForm();

  }


  initializeReplyForm() {
    this.replyCommentForm = new FormGroup({
      text: new FormControl(this.comment.text),
      // createdBy: new FormControl(this.authService.loggedInUser._id),
      referenceId: new FormControl(this.comment.referenceId),
      parentId: new FormControl(this.comment._id),
      type: new FormControl(this.comment.type)
    });
  }


  fromNow(date) {
    const d = new Date(+date);
    return moment(d).fromNow();
  }

  allowReply() {
    this.initializeReplyForm();
    this.replyEditorId = new Date().toDateString();
    this.reply = true;
  }

  updateFormData(event) {
    console.log('Update Event Fired From editor', event)
    this.replyCommentForm.get('text').setValue(event);
  }


  addReply() {
    // console.log(this.commentForm.value);
    if (this.authService.loggedInUser) {
      this.replyCommentForm.addControl('createdBy', new FormControl(this.authService.loggedInUser._id));
      this.commentService.addComment(this.replyCommentForm.value).pipe(
        // switchMap((d) => {
        //   return this.productService.getCommentsByReferenceId(d.referenceId);
        // }),
        tap((child) => {
          if (child && this.comment.children) {
            this.comment.children.push(child);
            this.replyTextEditorData = null;
            this.reply = false;
          }
        })
      ).subscribe();
    }
  }

  deleteComment() {
    this.commentService.deleteComment(this.comment._id).pipe(
      tap((d) => {
        console.log(d);
        this.comment = null;
        this.replyCommentForm = null;
      })
    ).subscribe();
  }

  updateComment() {
    this.commentService.updateComment(this.comment._id, this.replyCommentForm.get('text').value).pipe(
      tap((d) => {
        console.log(d);
        if (d) {
          this.edit = false;
        }
      })
    ).subscribe();
  }

}
